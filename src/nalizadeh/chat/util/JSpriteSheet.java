/*--- (C) 1999-2019 Techniker Krankenkasse ---*/

package nalizadeh.chat.util;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;

import javax.imageio.ImageIO;

public class JSpriteSheet {

	public JSpriteSheet() {
		try {
			BufferedImage bigImg =
				ImageIO.read(new File("C:/SPU/works/workspace_4.4/NmdrChat/tmp/icons.jpg"));

			final int width = 10;
			final int height = 10;
			final int rows = 5;
			final int cols = 5;
			BufferedImage[] sprites = new BufferedImage[rows * cols];

			for (int i = 0; i < rows; i++) {
				for (int j = 0; j < cols; j++) {
					sprites[(i * cols) + j] =
						bigImg.getSubimage(j * width, i * height, width, height);

					File outputfile = new File("ico_" + i + "" + j + ".png");
					ImageIO.write(sprites[(i * cols) + j], "png", outputfile);
				}
			}
		} catch (IOException ex) {

		}
	}
}

/*--- Formatiert nach TK Code Konventionen vom 05.03.2002 ---*/
