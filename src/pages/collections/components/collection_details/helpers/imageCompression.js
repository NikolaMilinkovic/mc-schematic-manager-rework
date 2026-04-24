import imageCompression from 'browser-image-compression';

async function imageCompressor(inputFile) {
  const file = inputFile;
  const options = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 600,
    useWebWorker: true,
  };
  try {
    const compressedFile = await imageCompression(file, options);
    console.log('compressedFile instanceof Blob', compressedFile instanceof Blob);
    console.log(`compressedFile size ${compressedFile.size / 1024 / 1024} MB`);
    return compressedFile;
  } catch (err) {
    console.error('Image compression error:', err);
    return null;
  }
}

export default imageCompressor;
