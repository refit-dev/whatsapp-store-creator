/**
 * Development Image Upload Service
 *
 * This provides a fallback for development when Supabase storage is not set up.
 * It uses placeholder images from Picsum for demonstration purposes.
 */

export class DevImageService {
  private static getRandomImageUrl(
    width: number = 400,
    height: number = 400
  ): string {
    const seed = Math.floor(Math.random() * 1000);
    return `https://picsum.photos/seed/${seed}/${width}/${height}`;
  }

  static generateMockUrl(imageType: string): string {
    switch (imageType) {
      case "logo":
        return this.getRandomImageUrl(200, 200);
      case "banner":
        return this.getRandomImageUrl(1200, 400);
      default:
        return this.getRandomImageUrl(400, 400);
    }
  }

  static async mockUpload(
    file: File,
    imageType: string
  ): Promise<{
    url: string;
    filename: string;
    size: number;
    contentType: string;
  }> {
    // Simulate upload delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      url: this.generateMockUrl(imageType),
      filename: `mock-${imageType}-${Date.now()}.jpg`,
      size: file.size,
      contentType: file.type,
    };
  }
}
