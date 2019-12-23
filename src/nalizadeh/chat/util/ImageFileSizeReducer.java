// Copyright (c) 2019 nalizadeh.org
//
// Permission is hereby granted, free of charge, to any person
// obtaining a copy of this software and associated documentation
// files (the "Software"), to deal in the Software without
// restriction, including without limitation the rights to use,
// copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the
// Software is furnished to do so, subject to the following
// conditions:
//
// The above copyright notice and this permission notice shall be
// included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
// EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
// OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
// WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
// OTHER DEALINGS IN THE SOFTWARE.

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
