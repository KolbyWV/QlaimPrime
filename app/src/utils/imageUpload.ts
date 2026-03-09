export function inferImageMimeType(uri) {
  const normalized = String(uri || "").toLowerCase().split("?")[0];
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".heic")) return "image/heic";
  if (normalized.endsWith(".heif")) return "image/heif";
  return "image/jpeg";
}

export async function uploadImageWithPresignedUrl({
  localUri,
  bucket,
  folder,
  createImageUploadUrl,
}) {
  const mimeType = inferImageMimeType(localUri);
  const localFileResponse = await fetch(localUri);
  if (!localFileResponse.ok) {
    throw new Error("Unable to read selected image.");
  }

  const blob = await localFileResponse.blob();
  const size = Number(blob?.size || 0);
  if (!size) {
    throw new Error("Selected image appears empty.");
  }

  const presignedResult = await createImageUploadUrl({
    variables: {
      bucket,
      mimeType,
      size,
      folder,
    },
  });

  const uploadUrl = presignedResult?.data?.createImageUploadUrl?.uploadUrl;
  const fileUrl = presignedResult?.data?.createImageUploadUrl?.fileUrl;
  if (!uploadUrl || !fileUrl) {
    throw new Error("Upload URL was not returned by the server.");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": mimeType,
    },
    body: blob,
  });
  if (!uploadResponse.ok) {
    throw new Error("Image upload failed.");
  }

  return fileUrl;
}
