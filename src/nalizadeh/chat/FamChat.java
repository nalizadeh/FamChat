/*--- (C) 1999-2019 Techniker Krankenkasse ---*/

package nalizadeh.chat;

import nalizadeh.chat.util.CellsLayout;

import java.awt.Color;
import java.awt.Dimension;
import java.awt.Font;
import java.awt.event.ActionEvent;
import java.awt.event.ActionListener;
import java.awt.event.WindowAdapter;
import java.awt.event.WindowEvent;
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.net.URL;
import java.net.UnknownHostException;
import java.util.Properties;
import java.util.Timer;
import java.util.TimerTask;

import javax.mail.Message;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;
import javax.swing.BorderFactory;
import javax.swing.ImageIcon;
import javax.swing.JButton;
import javax.swing.JCheckBox;
import javax.swing.JFileChooser;
import javax.swing.JFrame;
import javax.swing.JLabel;
import javax.swing.JOptionPane;
import javax.swing.JPanel;
import javax.swing.JScrollPane;
import javax.swing.JSpinner;
import javax.swing.JTextField;
import javax.swing.JTextPane;
import javax.swing.SpinnerNumberModel;
import javax.swing.UIManager;
import javax.swing.event.ChangeEvent;
import javax.swing.event.ChangeListener;

import org.slf4j.LoggerFactory;

/**
 * @author  nalizadeh.org
 */
public class FamChat extends JFrame {

	private static final long serialVersionUID = 1L;

	private static final String ROOT = "/works/workspace/NmdrChat/web/";
//  private static final String ROOT = "/web/works/workspace/NmdrChat/web/";
//	private static final String ROOT = "/SPU/works/workspace_4.4/NmdrChat/web/";
	private static final String ROOT_WS = ROOT;
	private static final String ROOT_CS = ROOT;

	private static final boolean SECURE_WS = false;
	private static final boolean SECURE_CS = false;

	private static final int PORT_WS = 8080;
	private static final int PORT_CS = 8181;

	private static final int PORT_WS_SS = 443;
	private static final int PORT_CS_SS = 444;

	private String SMTP_HOST = "";
	private int SMTP_PORT = 0;
	private String SMTP_USER = "";
	private String SMTP_PWD = "";

	static {
		LoggerFactory.createLogger("HttpServer");
		LoggerFactory.createLogger("ChatServer");
		LoggerFactory.createLogger("WebSocket");
	}

	private String rootWS = ROOT_WS;
	private String rootCS = ROOT_CS;
	private boolean secureWS = SECURE_WS;
	private boolean secureCS = SECURE_CS;

	private int portWS = SECURE_WS ? PORT_WS_SS : PORT_WS;
	private int portCS = SECURE_CS ? PORT_CS_SS : PORT_CS;

	private WebRunner webRunner = new WebRunner();
	private ChatRunner chatRunner = new ChatRunner(this);

	public FamChat() {
		super("FamChat");

		readConf();

		initUI();

		setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);

		addWindowListener(new WindowAdapter() {
				public void windowClosing(WindowEvent e) {
					exit();
				}
			}
		);

		setResizable(true);
		setIconImage(getImage("app.png").getImage());
		setLocation(100, 100);
		pack();

		setVisible(true);
		setSize(900, 600);
	}

	private void readConf() {

		boolean wsSec = SECURE_WS;
		boolean csSec = SECURE_CS;
		int portWs = PORT_WS;
		int portCs = PORT_CS;
		int portWsSS = PORT_WS_SS;
		int portCsSS = PORT_CS_SS;

		try(BufferedReader br = new BufferedReader(new FileReader(ROOT + "FamChat.conf"))) {
			for (String line; (line = br.readLine()) != null;) {
				line = line.trim();
				if (line.startsWith("FamChat_")) {
					String[] args = line.split(":");
					if (args.length == 2) {

						args[0] = args[0].trim();
						args[1] = args[1].trim();

						if (args[0].equals("FamChat_ROOT")) {
							rootWS = args[1];
							rootCS = args[1];
						} else if (args[0].equals("FamChat_WS_Port")) {
							portWs = Integer.parseInt(args[1]);
						} else if (args[0].equals("FamChat_CS_Port")) {
							portCs = Integer.parseInt(args[1]);
						} else if (args[0].equals("FamChat_WS_SECURE")) {
							wsSec = Boolean.parseBoolean(args[1]);
						} else if (args[0].equals("FamChat_CS_SECURE")) {
							csSec = Boolean.parseBoolean(args[1]);
						} else if (args[0].equals("FamChat_WS_SS_Port")) {
							portWsSS = Integer.parseInt(args[1]);
						} else if (args[0].equals("FamChat_CS_SS_Port")) {
							portCsSS = Integer.parseInt(args[1]);
						} else if (args[0].equals("FamChat_WS_SS_Port")) {
							portWsSS = Integer.parseInt(args[1]);
						} else if (args[0].equals("FamChat_SMTP_HOST")) {
							SMTP_HOST = args[1];
						} else if (args[0].equals("FamChat_SMTP_PORT")) {
							SMTP_PORT = Integer.parseInt(args[1]);
						} else if (args[0].equals("FamChat_SMTP_USER")) {
							SMTP_USER = args[1];
						} else if (args[0].equals("FamChat_SMTP_PWD")) {
							SMTP_PWD = args[1];
						}
					}
				}
			}
			br.close();

			portWS = wsSec ? portWsSS : portWs;
			portCS = csSec ? portCsSS : portCs;

		} catch (IOException ex) {
		}
	}

	/**
	 * @param   to
	 *
	 * @throws  Exception
	 */
	protected void sendEmail(String to) throws Exception {

		final String FROM = SMTP_USER;
		final String FROMNAME = "FamChat";
		final String SUBJECT = "FamChat password reset";

		final String BODY =
			String.join(
				System.getProperty("line.separator"),
				"<h1>FamChat password reset</h1>",
				"<p>Your password has been reset.</p>",
				"<p>Your new password is '12345678', after login you may change your password.</p>"
			);

		final String CONFIGSET = "ConfigSet";

		Properties props = System.getProperties();
		props.put("mail.transport.protocol", "smtp");
		props.put("mail.smtp.port", SMTP_PORT);
		props.put("mail.smtp.starttls.enable", "true");
		props.put("mail.smtp.auth", "true");

		Session session = Session.getDefaultInstance(props);

		MimeMessage msg = new MimeMessage(session);
		msg.setFrom(new InternetAddress(FROM, FROMNAME));
		msg.setRecipient(Message.RecipientType.TO, new InternetAddress(to));
		msg.setSubject(SUBJECT);
		msg.setContent(BODY, "text/html");

		msg.setHeader("X-SES-CONFIGURATION-SET", CONFIGSET);

		Transport transport = session.getTransport();
		transport.connect(SMTP_HOST, SMTP_USER, SMTP_PWD);

		transport.sendMessage(msg, msg.getAllRecipients());
	}

	private void exit() {
		int confirm =
			JOptionPane.showConfirmDialog(
				FamChat.this,
				"Are you sure you want to Exit?",
				"Shutdown and exit..",
				JOptionPane.YES_NO_OPTION,
				1
			);
		if (confirm == 0) {
			chatRunner.stop();
			webRunner.stop();
			setVisible(false);
			dispose();
			System.exit(0);
		}
	}

	protected void reboot() {

		webRunner.stop();
		chatRunner.stop();

		new Timer().schedule(
			new TimerTask() {
				@Override
				public void run() {
					webRunner.start();
					chatRunner.start();
				}
			},
			10000
		);
	}

	private void initUI() {

		final JTextPane tfWeb = new JTextPane();
		final JTextPane tfChat = new JTextPane();

		tfWeb.setEditable(false);
		tfChat.setEditable(false);
		tfWeb.setBackground(new Color(255, 255, 245));
		tfChat.setBackground(new Color(255, 255, 245));

		LoggerFactory.getLogger("HttpServer").setConsole(tfWeb, 200, new Color(37, 117, 160), Color.RED);

		LoggerFactory.getLogger("ChatServer").setConsole(tfChat, 200, new Color(52, 146, 68), Color.RED);

		LoggerFactory.getLogger("WebSocket").setConsole(tfChat, 200, Color.BLACK, Color.RED);

		JScrollPane spWeb = new JScrollPane();
		JScrollPane spChat = new JScrollPane();
		spWeb.getViewport().add(tfWeb);
		spChat.getViewport().add(tfChat);
		spWeb.setBorder(BorderFactory.createEmptyBorder(1, 1, 1, 1));
		spChat.setBorder(BorderFactory.createEmptyBorder(1, 1, 1, 1));

		final JTextField tfRootWS = new JTextField();
		final JTextField tfRootCS = new JTextField();
		final JTextField tfPortWS = new JTextField();
		final JTextField tfPortCS = new JTextField();
		final JCheckBox cbSecureWS = new JCheckBox("Secure");
		final JCheckBox cbSecureCS = new JCheckBox("Secure");
		final JCheckBox cbTraceWS = new JCheckBox("Trace");
		final JCheckBox cbTraceCS = new JCheckBox("Trace");

		SpinnerNumberModel model = new SpinnerNumberModel(200, 100, 2000, 50);
		final JSpinner spLines = new JSpinner(model);

		final JLabel l1 = new JLabel("HTTP server");
		final JLabel l2 = new JLabel("CHAT server");
		final JLabel l3 = new JLabel("Copyright (C) 2019 nalizadeh.org");

		l1.setFont(new Font("Tahoma Fett", Font.BOLD, 12));
		l2.setFont(new Font("Tahoma Fett", Font.BOLD, 12));
		l3.setFont(new Font("Tahoma", Font.PLAIN, 10));
		l3.setForeground(new Color(126, 111, 0));
		l1.setIcon(getImage("stopped.png"));
		l2.setIcon(getImage("stopped.png"));

		tfRootWS.setText(rootWS);
		tfRootCS.setText(rootCS);
		tfPortWS.setText(Integer.toString(portWS));
		tfPortCS.setText(Integer.toString(portCS));
		cbSecureWS.setSelected(secureWS);
		cbSecureCS.setSelected(secureCS);

		final JButton btStopWS = new JButton("Stop");
		final JButton btStopCS = new JButton("Stop");
		final JButton btDirWS = new JButton("...");
		final JButton btDirCS = new JButton("...");
		final JButton btStartWS = new JButton("Start");
		final JButton btStartCS = new JButton("Start");
		final JButton btExit = new JButton("Exit");

		btStopWS.setEnabled(false);
		btStopCS.setEnabled(false);
		cbTraceWS.setEnabled(false);
		cbTraceCS.setSelected(true);

		btDirWS.setPreferredSize(new Dimension(24, 24));
		btDirCS.setPreferredSize(new Dimension(24, 24));

		final FamChat self = this;

		btDirWS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					JFileChooser chooser = new JFileChooser(btDirWS.getText());
					chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
					int returnVal = chooser.showOpenDialog(self);
					if (returnVal == JFileChooser.APPROVE_OPTION) {
						rootWS = chooser.getSelectedFile().getAbsolutePath();
					}
				}
			}
		);

		cbSecureWS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					tfPortWS.setText(Integer.toString(cbSecureWS.isSelected() ? PORT_WS_SS : PORT_WS));
				}
			}
		);

		btStopWS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					webRunner.stop();
					tfWeb.setText("");
					l1.setIcon(getImage("stopped.png"));
					btStopWS.setEnabled(false);
					btStartWS.setEnabled(true);
					tfRootWS.setEnabled(true);
					btDirWS.setEnabled(true);
					tfPortWS.setEnabled(true);
					cbSecureWS.setEnabled(true);
				}
			}
		);

		btStartWS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					rootWS = tfRootWS.getText();
					portWS = Integer.parseInt(tfPortWS.getText());
					secureWS = cbSecureWS.isSelected();
					webRunner.start();
					l1.setIcon(getImage("started.png"));
					btStopWS.setEnabled(true);
					btStartWS.setEnabled(false);
					tfRootWS.setEnabled(false);
					btDirWS.setEnabled(false);
					tfPortWS.setEnabled(false);
					cbSecureWS.setEnabled(false);
				}
			}
		);

		btDirCS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					JFileChooser chooser = new JFileChooser(btDirCS.getText());
					chooser.setFileSelectionMode(JFileChooser.DIRECTORIES_ONLY);
					int returnVal = chooser.showOpenDialog(self);
					if (returnVal == JFileChooser.APPROVE_OPTION) {
						rootCS = chooser.getSelectedFile().getAbsolutePath();
					}
				}
			}
		);

		cbSecureCS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					tfPortCS.setText(Integer.toString(cbSecureCS.isSelected() ? PORT_CS_SS : PORT_CS));
				}
			}
		);

		cbTraceCS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					setTrace("WebSocket", cbTraceCS.isSelected());
				}
			}
		);

		btStopCS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					chatRunner.stop();
					tfChat.setText("");
					l2.setIcon(getImage("stopped.png"));
					btStopCS.setEnabled(false);
					btStartCS.setEnabled(true);
					tfRootCS.setEnabled(true);
					btDirCS.setEnabled(true);
					tfPortCS.setEnabled(true);
					cbSecureCS.setEnabled(true);
				}
			}
		);

		btStartCS.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					rootCS = tfRootCS.getText();
					portCS = Integer.parseInt(tfPortCS.getText());
					secureCS = cbSecureCS.isSelected();
					chatRunner.start();
					l2.setIcon(getImage("started.png"));
					btStopCS.setEnabled(true);
					btStartCS.setEnabled(false);
					tfRootCS.setEnabled(false);
					btDirCS.setEnabled(false);
					tfPortCS.setEnabled(false);
					cbSecureCS.setEnabled(false);
				}
			}
		);

		spLines.addChangeListener(
			new ChangeListener() {
				public void stateChanged(ChangeEvent e) {
					LoggerFactory.getLogger("HttpServer").setLines((Integer) spLines.getModel().getValue());
					LoggerFactory.getLogger("ChatServer").setLines((Integer) spLines.getModel().getValue());
					LoggerFactory.getLogger("WebSocket").setLines((Integer) spLines.getModel().getValue());
				}
			}
		);

		btExit.addActionListener(
			new ActionListener() {
				public void actionPerformed(ActionEvent e) {
					exit();
				}
			}
		);

		//== Layouting

		double[][] constraints =
			{
				{ 24.0, CellsLayout.FILL, 24.0, CellsLayout.FILL, 24.0 },
				{ 200.0, CellsLayout.FILL, 25.0, 280.0, 24.0, 22.0, 40.0, 58.0, 55.0, 60.0, 60.0 }
			};

		JPanel pan = new JPanel(new CellsLayout(constraints, 4, 4));

		pan.add(l1, new CellsLayout.Cell(0, 0));
		pan.add(new JLabel("Root"), new CellsLayout.Cell(0, 2));
		pan.add(tfRootWS, new CellsLayout.Cell(0, 3));
		pan.add(btDirWS, new CellsLayout.Cell(0, 4));
		pan.add(new JLabel("Port"), new CellsLayout.Cell(0, 5));
		pan.add(tfPortWS, new CellsLayout.Cell(0, 6));
		pan.add(cbSecureWS, new CellsLayout.Cell(0, 7));
		pan.add(cbTraceWS, new CellsLayout.Cell(0, 8));
		pan.add(btStopWS, new CellsLayout.Cell(0, 9));
		pan.add(btStartWS, new CellsLayout.Cell(0, 10));
		pan.add(spWeb, new CellsLayout.Cell(1, 0, 0, 10));

		//==

		pan.add(l2, new CellsLayout.Cell(2, 0));
		pan.add(new JLabel("Root"), new CellsLayout.Cell(2, 2));
		pan.add(tfRootCS, new CellsLayout.Cell(2, 3));
		pan.add(btDirCS, new CellsLayout.Cell(2, 4));
		pan.add(new JLabel("Port"), new CellsLayout.Cell(2, 5));
		pan.add(tfPortCS, new CellsLayout.Cell(2, 6));
		pan.add(cbSecureCS, new CellsLayout.Cell(2, 7));
		pan.add(cbTraceCS, new CellsLayout.Cell(2, 8));
		pan.add(btStopCS, new CellsLayout.Cell(2, 9));
		pan.add(btStartCS, new CellsLayout.Cell(2, 10));
		pan.add(spChat, new CellsLayout.Cell(3, 0, 0, 10));

		pan.add(l3, new CellsLayout.Cell(4, 0));
		pan.add(spLines, new CellsLayout.Cell(4, 9));
		pan.add(btExit, new CellsLayout.Cell(4, 10));

		getContentPane().add(pan);
	}

	public void setTrace(String id, boolean traceEnabled) {
		LoggerFactory.getLogger(id).setTraceEnabled(traceEnabled);
	}

	public static ImageIcon getImage(String name) {
		URL url = FamChat.class.getResource("img/" + name);
		if (url != null) {
			return new ImageIcon(url);
		}
		return null;
	}

	//========================

	class WebRunner implements Runnable {

		private HttpServer server;

		public void start() {
			this.server = new HttpServer(portWS, rootWS, secureWS);
			new Thread(this).start();
		}

		public void stop() {
			try {
				if (server != null) {
					server.stop();
					server = null;
				}
			} catch (Exception ex) {
				LoggerFactory.getLogger("HttpServer").error(ex.getMessage(), ex);
			}
		}

		@Override
		public void run() {
			try {
				server.start();
			} catch (Exception ex) {
				LoggerFactory.getLogger("HttpServer").error(ex.getMessage(), ex);
			}
		}
	}

	class ChatRunner implements Runnable {

		private ChatServer server;
		private FamChat famchat;

		public ChatRunner(FamChat famchat) {
			this.famchat = famchat;
		}

		public void start() {
			try {
				this.server = new ChatServer(portCS, rootCS, secureCS);
				this.server.setFamChat(famchat);
				new Thread(this).start();
			} catch (UnknownHostException ex) {
				LoggerFactory.getLogger("ChatServer").error(ex.getMessage(), ex);
			}
		}

		public void stop() {
			try {
				if (server != null) {
					server.stop();
					server = null;
				}
			} catch (Exception ex) {
				LoggerFactory.getLogger("ChatServer").error(ex.getMessage(), ex);
			}
		}

		@Override
		public void run() {
			try {
				server.start();
			} catch (Exception ex) {
				LoggerFactory.getLogger("ChatServer").error(ex.getMessage(), ex);
			}
		}
	}

	public static void main(String[] args) {
		try {
			UIManager.setLookAndFeel("com.sun.java.swing.plaf.windows.WindowsLookAndFeel");
		} catch (Exception e) {
			e.printStackTrace();
		}

		new FamChat();
	}
}

/*--- Formatiert nach TK Code Konventionen vom 05.03.2002 ---*/
