package org.nalizadeh.chat.util;

import java.net.URL;

import javax.swing.JEditorPane;
import javax.swing.JFrame;
import javax.swing.JScrollPane;

public class HTMLViewer {

  public static void main(String[] a)throws Exception {
    JFrame frame = new JFrame();
    frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);

    JEditorPane editorPane = new JEditorPane();

    editorPane.setPage(new URL("http://google.de"));

    frame.add(new JScrollPane(editorPane));

    frame.setSize(300, 200);
    frame.setVisible(true);
  }

}