import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import {
  CodeCommitClient,
  GetPullRequestCommand,
  GetDifferencesCommand,
  GetBlobCommand,
  PostCommentForPullRequestCommand,
} from "@aws-sdk/client-codecommit";
import { diffLines } from "diff";
import { generateReviewPrompt } from "./prompt";

const bedrockClient = new BedrockRuntimeClient({ region: process.env.AWS_REGION });
const codecommitClient = new CodeCommitClient({ region: process.env.AWS_REGION });

const createDiffText = (fileDiffs: string[]): string => {
  return fileDiffs.join("\n\n");
}

const createBedrockInput = (prompt: string, maxTokens: number): any => {
  return {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: maxTokens,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ]
  }
}

export const handler = async (event: any) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const pullRequestId = event.detail.pullRequestId;
  const repositoryName = event.detail.repositoryNames[0];

  const pullRequest = await codecommitClient.send(new GetPullRequestCommand({ pullRequestId }));
  const targets = pullRequest.pullRequest?.pullRequestTargets;
  const sourceCommit = targets?.[0]?.sourceCommit;
  const destinationCommit = targets?.[0]?.destinationCommit;
  const destinationRef = targets?.[0]?.destinationReference;

  if (!sourceCommit || !destinationCommit || destinationRef !== "refs/heads/develop") {
    console.log("対象外のブランチ、または必要な情報が不足しているためスキップします。");
    return;
  }

  const diffMaxResults = parseInt(process.env.DIFF_MAX_RESULTS || "10", 10);
  const modelId = process.env.MODEL_ID || "anthropic.claude-3-haiku-20240307-v1:0";
  const maxTokens = parseInt(process.env.MAX_TOKENS || "1024", 10);

  const diffResponse = await codecommitClient.send(
    new GetDifferencesCommand({
      repositoryName,
      beforeCommitSpecifier: destinationCommit,
      afterCommitSpecifier: sourceCommit,
      MaxResults: diffMaxResults,
    })
  );

  const differences = diffResponse.differences || [];
  const fileDiffs: string[] = [];

  for (const diff of differences) {
    console.log(diff)
    const beforeBlobId = diff.beforeBlob?.blobId;
    const afterBlobId = diff.afterBlob?.blobId;
    const filePath = diff.afterBlob?.path || diff.beforeBlob?.path || "unknown file";

    const beforeContent = beforeBlobId
      ? new TextDecoder("utf-8").decode(
          (await codecommitClient.send(new GetBlobCommand({ repositoryName, blobId: beforeBlobId }))).content
        )
      : "";
    const afterContent = afterBlobId
      ? new TextDecoder("utf-8").decode(
          (await codecommitClient.send(new GetBlobCommand({ repositoryName, blobId: afterBlobId }))).content
        )
      : "";

    console.log(afterContent)

    const diffs = diffLines(beforeContent, afterContent)
      .map((c) => (c.added ? "+" : c.removed ? "-" : " ") + c.value)
      .join("");

    fileDiffs.push(`【ファイル】${filePath}\n${diffs}`);
  }

  const diffText = createDiffText(fileDiffs);
  const prompt = generateReviewPrompt(diffText);
  const bedrockInput = createBedrockInput(prompt, maxTokens);

  const response = await bedrockClient.send(
    new InvokeModelCommand({ modelId, contentType: "application/json", body: JSON.stringify(bedrockInput),  })
  );

  const body = new TextDecoder("utf-8").decode(response.body);
  const result = JSON.parse(body);
  console.log("Bedrock Response:", result);

  const reviewComment = result.content?.[0]?.text || "レビュー結果が取得できませんでした。";

  await codecommitClient.send(
    new PostCommentForPullRequestCommand({
      pullRequestId,
      repositoryName,
      beforeCommitId: sourceCommit,
      afterCommitId: destinationCommit,
      content: reviewComment,
    })
  );

  console.log("レビューコメントを投稿しました。");
};
