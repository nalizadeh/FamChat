package nalizadeh.chat.util;

import java.io.*;
import java.util.Iterator;
import javax.imageio.*;
import javax.imageio.stream.*;
import java.awt.image.*;

public class ImageFileSizeReducer {

	public static void reduceImageQuality(int sizeThreshold, String srcImg, String destImg) throws Exception {
		float quality = 1.0f;

		quality = 0.005f;

		File file = new File(srcImg);

		Iterator<ImageWriter> iter = ImageIO.getImageWritersByFormatName("jpeg");

		ImageWriter writer = (ImageWriter) iter.next();

		ImageWriteParam iwp = writer.getDefaultWriteParam();

		iwp.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);

		FileInputStream inputStream = new FileInputStream(file);

		BufferedImage originalImage = ImageIO.read(inputStream);
		IIOImage image = new IIOImage(originalImage, null, null);

		File fileOut = new File(destImg);
		if (fileOut.exists()) {
			fileOut.delete();
		}

		FileImageOutputStream output = new FileImageOutputStream(fileOut);

		writer.setOutput(output);

		iwp.setCompressionQuality(quality);

		writer.write(null, image, iwp);

		output.close();

		writer.dispose();
	}

	public static void main(String[] args) throws Exception {
		reduceImageQuality(204800, "D:\\works\\tmp\\1.jpg", "D:\\works\\tmp\\2.jpg");

		System.out.println("DONE");
	}
}
