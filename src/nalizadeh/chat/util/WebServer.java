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

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import nalizadeh.chat.util.Logger.LoggerFactory;

/**
 * @author  nalizadeh.org
 */
public class WebServer {

	private static final int DEFAULT_PORT = 8080;
	private static final String DEFAULT_ROOT = "web";

	//private static final String DEFAULT_ROOT = System.getProperty("user.dir");
	private static final String VERSION = "HTTP/1.0";
	private static final int N_THREADS = 3;

	private String root;
	private Integer port;
	private Logger log;

	public WebServer() {
		this(DEFAULT_PORT, DEFAULT_ROOT);
	}

	public WebServer(Integer port, String root) {

		this.port = port == null ? DEFAULT_PORT : port;
		this.root = root == null ? DEFAULT_ROOT : root;

		log = LoggerFactory.getLogger("HttpServer");

		try {
			start(this.port);
		} catch (Exception e) {
			log.error("Startup Error", e);
		}
	}

	public void start(int port) throws IOException {
		@SuppressWarnings("resource")
		ServerSocket s = new ServerSocket(port);
		log.trace("Web server listening on port " + port);
		ExecutorService executor = Executors.newFixedThreadPool(N_THREADS);
		while (true) {
			executor.submit(new RequestHandler(s.accept()));
		}
	}

	/**
	 * Parse command line arguments (string[] args) for valid port number and root path
	 */
	private void getValidPortRoot(String[] args) throws NumberFormatException {

		port = DEFAULT_PORT;
		root = DEFAULT_ROOT;

		if (args.length > 0) {
			port = Integer.parseInt(args[0]);
			if (port > 0 && port < 65535) {
				port = DEFAULT_PORT;
			} else {
				throw new NumberFormatException(
					"Invalid port! Port value is a number between 0 and 65535"
				);
			}

			if (args.length > 1) {
				root = args[1];
			}
		}
	}

	public static void main(String[] args) {
		new WebServer().getValidPortRoot(args);
	}

	//==========================

	/**
	 * Class <code>RequestHandler</code> - Thread class that answer the requests in the socket
	 */
	private class RequestHandler implements Runnable {

		private Socket socket;

		public RequestHandler(Socket socket) {
			this.socket = socket;
		}

		public void run() {
			try {
				HttpRequest req = new HttpRequest(socket.getInputStream());
				HttpResponse res = new HttpResponse(req);
				res.write(socket.getOutputStream());
				socket.close();
			} catch (Exception e) {
				log.error("Runtime Error", e);
			}
		}
	}

	//==========================

	/**
	 * HttpRequest class parses the HTTP Request Line (method, URI, version) and Headers
	 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
	 */
	private class HttpRequest {

		List<String> headers = new ArrayList<String>();

		Method method;
		String uri;
		String version;

		public HttpRequest(InputStream is) throws IOException {
			BufferedReader reader = new BufferedReader(new InputStreamReader(is));
			String str = reader.readLine();
			parseRequestLine(str);

			while (!str.equals("")) {
				str = reader.readLine();
				parseRequestHeader(str);
			}
		}

		private void parseRequestLine(String str) {
			log.trace(str);
			String[] split = str.split("\\s+");
			try {
				method = Method.valueOf(split[0]);
			} catch (Exception e) {
				method = Method.UNRECOGNIZED;
			}
			uri = split[1];
			version = split[2];
		}

		private void parseRequestHeader(String str) {
			log.trace(str);
			headers.add(str);
		}
	}

	//========================

	/**
	 * HttpResponse class defines the HTTP Response Status Line (method, URI, version) and Headers
	 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html
	 */
	private class HttpResponse {

		List<String> headers = new ArrayList<String>();

		byte[] body;

		public HttpResponse(HttpRequest req) throws IOException {

			switch (req.method) {

				case HEAD :
					fillHeaders(Status._200);
					break;

				case GET :
					try {

						File file = new File(root + "/" + req.uri);

						if (file.isDirectory()) {
							fillHeaders(Status._200);

							headers.add(ContentType.HTML.toString());
							StringBuilder result =
								new StringBuilder("<html><head><title>Index of ");
							result.append(req.uri);
							result.append("</title></head><body><h1>Index of ");
							result.append(req.uri);
							result.append("</h1><hr><pre>");

							// TODO add Parent Directory
							File[] files = file.listFiles();
							for (File subfile : files) {
								result.append(
									" <a href=\"" + subfile.getPath() + "\">" + subfile.getPath()
									+ "</a>\n"
								);
							}
							result.append("<hr></pre></body></html>");
							fillResponse(result.toString());
						} else if (file.exists()) {
							fillHeaders(Status._200);
							setContentType(req.uri, headers);
							fillResponse(getBytes(file));
						} else {
							log.trace("File not found:" + req.uri);
							fillHeaders(Status._404);
							fillResponse(Status._404.toString());
						}
					} catch (Exception e) {
						log.error("Response Error", e);
						fillHeaders(Status._400);
						fillResponse(Status._400.toString());
					}

					break;

				case UNRECOGNIZED :
					fillHeaders(Status._400);
					fillResponse(Status._400.toString());
					break;

				default :
					fillHeaders(Status._501);
					fillResponse(Status._501.toString());
			}
		}

		private byte[] getBytes(File file) throws IOException {
			int length = (int) file.length();
			byte[] array = new byte[length];
			InputStream in = new FileInputStream(file);
			int offset = 0;
			while (offset < length) {
				int count = in.read(array, offset, (length - offset));
				offset += count;
			}
			in.close();
			return array;
		}

		private void fillHeaders(Status status) {
			headers.add(VERSION + " " + status.toString());
			headers.add("Connection: close");
			headers.add("Server: SimpleWebServer");
		}

		private void fillResponse(String response) {
			body = response.getBytes();
		}

		private void fillResponse(byte[] response) {
			body = response;
		}

		public void write(OutputStream os) throws IOException {
			DataOutputStream output = new DataOutputStream(os);
			for (String header : headers) {
				output.writeBytes(header + "\r\n");
			}
			output.writeBytes("\r\n");
			if (body != null) {
				output.write(body);
			}
			output.writeBytes("\r\n");
			output.flush();
		}

		private void setContentType(String uri, List<String> list) {
			try {
				String ext = uri.substring(uri.indexOf(".") + 1);
				list.add(ContentType.valueOf(ext.toUpperCase()).toString());
			} catch (Exception e) {
				log.error("ContentType not found: " + e, e);
			}
		}
	}

	//=====================================

	/**
	 * Method enum maps the HTTP/1.1 available request methods
	 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec5.html
	 */
	private enum Method {
		GET("GET"), //
		HEAD("HEAD"), //
		POST("POST"), //
		PUT("PUT"), //
		DELETE("DELETE"), //
		TRACE("TRACE"), //
		CONNECT("CONNECT"), //
		UNRECOGNIZED(null); //

		private final String method;

		Method(String method) {
			this.method = method;
		}
	}

	/**
	 * ContentType enum uses the file extension to loosely map the available content type based on
	 * common media types: http://en.wikipedia.org/wiki/Internet_media_type
	 */
	private enum ContentType {
		CSS("CSS"), //
		GIF("GIF"), //
		HTM("HTM"), //
		HTML("HTML"), //
		ICO("ICO"), //
		JPG("JPG"), //
		JPEG("JPEG"), //
		PNG("PNG"), //
		TXT("TXT"), //
		XML("XML"); //

		private final String extension;

		ContentType(String extension) {
			this.extension = extension;
		}

		@Override
		public String toString() {
			switch (this) {

				case CSS :
					return "Content-Type: text/css";

				case GIF :
					return "Content-Type: image/gif";

				case HTM :
				case HTML :
					return "Content-Type: text/html";

				case ICO :
					return "Content-Type: image/gif";

				case JPG :
				case JPEG :
					return "Content-Type: image/jpeg";

				case PNG :
					return "Content-Type: image/png";

				case TXT :
					return "Content-type: text/plain";

				case XML :
					return "Content-type: text/xml";

				default :
					return null;
			}
		}
	}

	/**
	 * Status enum maps the HTTP/1.1 available response status codes
	 * http://www.w3.org/Protocols/rfc2616/rfc2616-sec6.html
	 */
	private enum Status {
		_100("100 Continue"), //
		_101("101 Switching Protocols"), //
		_200("200 OK"), //
		_201("201 Created"), //
		_202("202 Accepted"), //
		_203("203 Non-Authoritative Information"), //
		_204("204 No Content"), //
		_205("205 Reset Content"), //
		_206("206 Partial Content"), //
		_300("300 Multiple Choices"), //
		_301("301 Moved Permanently"), //
		_302("302 Found"), //
		_303("303 See Other"), //
		_304("304 Not Modified"), //
		_305("305 Use Proxy"), //
		_307("307 Temporary Redirect"), //
		_400("400 Bad Request"), //
		_401("401 Unauthorized"), //
		_402("402 Payment Required"), //
		_403("403 Forbidden"), //
		_404("404 Not Found"), //
		_405("405 Method Not Allowed"), //
		_406("406 Not Acceptable"), //
		_407("407 Proxy Authentication Required"), //
		_408("408 Request Time-out"), //
		_409("409 Conflict"), //
		_410("410 Gone"), //
		_411("411 Length Required"), //
		_412("412 Precondition Failed"), //
		_413("413 Request Entity Too Large"), //
		_414("414 Request-URI Too Large"), //
		_415("415 Unsupported Media Type"), //
		_416("416 Requested range not satisfiable"), //
		_417("417 Expectation Failed"), //
		_500("500 Internal Server Error"), //
		_501("501 Not Implemented"), //
		_502("502 Bad Gateway"), //
		_503("503 Service Unavailable"), //
		_504("504 Gateway Time-out"), //
		_505("505 HTTP Version not supported"); //

		private final String status;

		Status(String status) {
			this.status = status;
		}

		@Override
		public String toString() {
			return status;
		}
	}
}
