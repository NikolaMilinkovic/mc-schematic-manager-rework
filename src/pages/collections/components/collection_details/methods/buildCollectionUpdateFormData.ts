import { encodeToBlurHash } from "../../../../../lib/imageUtils";
import imageCompressor from "../helpers/imageCompression.js";
import setFileToBase64 from "../helpers/setFileToBase64.js";

type BuildCollectionUpdateFormDataArgs = {
  name: string;
  tags: string[];
  imageFile: File | null;
};

export async function buildCollectionUpdateFormData({
  name,
  tags,
  imageFile,
}: BuildCollectionUpdateFormDataArgs): Promise<FormData> {
  const formData = new FormData();
  formData.append("name", name.trim());
  formData.append("tags", tags.join(","));

  if (!imageFile) {
    return formData;
  }

  const compressedImage = await imageCompressor(imageFile);
  if (!compressedImage) {
    throw new Error("Image compression failed.");
  }

  const imageBase64 = await setFileToBase64(compressedImage);
  formData.append("avatar", imageBase64);

  const { blurHash, width, height } = await encodeToBlurHash(compressedImage);
  formData.append("blurHash", blurHash);
  formData.append("blurHashWidth", String(width));
  formData.append("blurHashHeight", String(height));

  return formData;
}
