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

package nalizadeh.chat;

import java.awt.image.BufferedImage;
import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.FileReader;
import java.io.FileWriter;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.UnknownHostException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.security.KeyStore;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.security.spec.InvalidKeySpecException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Objects;
import java.util.Random;
import java.util.regex.Pattern;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import javax.imageio.ImageIO;
import javax.net.ssl.KeyManagerFactory;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManagerFactory;

import org.java_websocket.WebSocket;
import org.java_websocket.handshake.ClientHandshake;
import org.java_websocket.server.DefaultSSLWebSocketServerFactory;
import org.java_websocket.server.WebSocketServer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.internal.LinkedTreeMap;
import com.google.gson.reflect.TypeToken;

/**
 * Author: nalizadeh.org
 */
public class ChatServer extends WebSocketServer {

	private static final String ROOT = "/works/workspace/NmdrChat/web/";
	//private static String ROOT = System.getProperty("user.dir");

	private static final boolean SECURE = true;
	private static final int PORT = 8181;
	private static final int PORT_SS = 444;
	
	private static String USERS_DB = "/db/users.db";
	private static String GROUPS_DB = "/db/groups.db";
	private static String CHATS_DB = "/db/chats.db";

	private static String SEPERATOR = "||";
	private static String SEPERATUG = ";";

	private static String ADMIN = "admin";

	private Map<String, WebSocket> conns = new HashMap<String, WebSocket>();

	private List<User> users = new ArrayList<User>();
	private List<Group> groups = new ArrayList<Group>();

	private String root;
	
	private String keystore;
	private String storepwd;
	private String keypwd;
	
	private static boolean isActive = false;

	private static final Logger log = LoggerFactory.getLogger("ChatServer");

	String fileUser;
	String fileChannel;
	String fileName;
	boolean fileIsAvatar;

	FamChat famchat;

	/**
	 * @author  nalizadeh.org
	 */
	private enum REQUEST_TYPES {
		InitUsers(100), //
		InitGroups(101), //
		Open(102), //
		Close(103), //
		Login(104), //
		LoginCookie(105), //
		Logout(106), //
		GetUser(107), //
		GetGroup(108), //
		GetAllUsers(109), //
		GetAllGroups(110), //
		GetGroups(111), //
		CreateUser(112), //
		DeleteUser(113), //
		UpdateUser(114), //
		GetContacts(115), //
		AddContact(116), //
		RemoveContact(117), //
		AddGroup(118), //
		RemoveGroup(119), //
		CreateGroup(120), //
		UpdateGroup(121), //
		DeleteGroup(122), //
		AddToGroup(123), //
		RemoveFromGroup(124), //
		GetChannel(125), //
		ReadChat(126), //
		WriteChat(127), //
		DeleteChat(128), //
		UpdateChat(129), //
		ReceivedChat(130), //
		ForwardChat(131), //
		DownloadFile(132), //
		UploadFile(133), //
		ResetPassword(134), //
		Reboot(1000);

		private final int type;

		REQUEST_TYPES(int type) {
			this.type = type;
		}

		public boolean isEqual(int type) {
			return this.type == type;
		}

		public static REQUEST_TYPES fromType(int type) {
			for (REQUEST_TYPES rt : REQUEST_TYPES.values()) {
				if (rt.type == type) {
					return rt;
				}
			}
			return null;
		}
	}

	/**
	 * @author  nalizadeh.org
	 */
	private enum RESPONSE_TYPES {
		OK(0), //
		ERROR(1), //
		CONN_OPENED(2), //
		CONN_CLOSED(3), //
		USER_LOGIN(4), //
		USER_LOGOUT(5), //
		USER_UPDATED(6), //
		CHAT_SENT(7), //
		CHAT_RECEIVED(8), //
		CHAT_DELETED(9), //
		CHAT_UPDATED(10);

		private final int type;

		RESPONSE_TYPES(int type) {
			this.type = type;
		}
	}

	/**
	 * @throws  UnknownHostException
	 */
	public ChatServer() throws UnknownHostException {
		this(SECURE ? PORT_SS : PORT, ROOT, SECURE, null, null, null);
	}

	/**
	 * @throws  UnknownHostException
	 */
	public ChatServer(
			Integer port, 
			String root, 
			boolean secure,
			String keystore,
			String storepwd, 
			String keypwd) throws UnknownHostException {

		super(new InetSocketAddress(port == null ? secure ? PORT_SS : PORT : port));

		this.root = root == null ? ROOT : root;
		this.keystore = keystore;
		this.storepwd = storepwd;
		this.keypwd = keypwd;

		initDB();

		if (secure) {
			try {
				String STORETYPE = "JKS";
				String KEYSTORE = this.root + this.keystore;
				String STOREPASSWORD = this.storepwd;
				String KEYPASSWORD = this.keypwd;

				KeyStore ks = KeyStore.getInstance(STORETYPE);
				File kf = new File(KEYSTORE);
				ks.load(new FileInputStream(kf), STOREPASSWORD.toCharArray());

				KeyManagerFactory kmf = KeyManagerFactory.getInstance("SunX509");
				kmf.init(ks, KEYPASSWORD.toCharArray());
				TrustManagerFactory tmf = TrustManagerFactory.getInstance("SunX509");
				tmf.init(ks);

				SSLContext sslContext = SSLContext.getInstance("TLS");
				sslContext.init(kmf.getKeyManagers(), tmf.getTrustManagers(), null);

				setWebSocketFactory(new DefaultSSLWebSocketServerFactory(sslContext));

			} catch (Exception ex) {
				log.error(ex.getMessage(), ex);
			}
		}
	}

	@Override
	public void onOpen(WebSocket conn, ClientHandshake handshake) {
		handleRequest(new Request(conn, "{type:" + REQUEST_TYPES.Open.type + "}", null));
	}

	@Override
	public void onClose(WebSocket conn, int type, String reason, boolean remote) {
		handleRequest(new Request(conn, "{type:" + REQUEST_TYPES.Close.type + "}", null));
	}

	@Override
	public void onMessage(WebSocket conn, String message) {
		handleRequest(new Request(conn, message, null));
	}

	@Override
	public void onMessage(WebSocket conn, ByteBuffer message) {
		handleRequest(new Request(conn, null, message));
	}

	@Override
	public void onError(WebSocket conn, Exception ex) {
		ex.printStackTrace();
		if (conn != null) {
			// some errors like port binding failed may not be assignable to a specific websocket
		}
	}

	@Override
	public void onStart() {
		log.trace("Chat server is listening on port " + getPort());
		setConnectionLostTimeout(0);
		setConnectionLostTimeout(100);
	}

	@Override
	public void onStop() {
		log.trace("Chat server is stopped.");
	}

	protected void setFamChat(FamChat fc) {
		this.famchat = fc;
	}

	/**
	 * @param   conn
	 *
	 * @return  String
	 */
	private String getHostname(WebSocket conn) {
		String rc = "";
		try {
			rc = conn.getRemoteSocketAddress().getAddress().getHostAddress();
		} catch (Exception ex) {

		}
		return rc;
	}

	/**
	 */
	private void initDB() {
		handleRequest(new Request(null, "{type:" + REQUEST_TYPES.InitUsers.type + "}", null));
		handleRequest(new Request(null, "{type:" + REQUEST_TYPES.InitGroups.type + "}", null));
	}

	//==== USERS ====

	/**
	 * @param   conn
	 *
	 * @return  Response
	 */
	private Response open(WebSocket conn) {
		return new Response(RESPONSE_TYPES.OK, "Welcome to the server!", null, null);
	}

	/**
	 * @param   conn
	 *
	 * @return  Response
	 */
	private Response close(WebSocket conn) {
		String key = null;
		for (Entry<String, WebSocket> entry : conns.entrySet()) {
			if (Objects.equals(conn, entry.getValue())) {
				key = entry.getKey();
				break;
			}
		}
		if (key != null) {
			User user = findUser(key);
			user.status = "0";

			// immediately call doNotify
			new Notify(this, key, null, RESPONSE_TYPES.CONN_CLOSED).doNotify();
			conns.remove(key);
		}
		return new Response(RESPONSE_TYPES.OK, "Connection closed.", null, null);
	}

	/**
	 * @param   conn
	 * @param   name
	 * @param   password
	 *
	 * @return  Response
	 */
	private Response loginUser(WebSocket conn, String name, String password, boolean cookieUsed) {

		if (conns.get(name) != null) {
			return new Response(RESPONSE_TYPES.ERROR, "The user is already logged in.", null, null);
		}

		User user = findUser(name);
		if (user != null) {
			if (cookieUsed || PasswordUtils.verifyUserPassword(password, user.password, user.salt)) {
				conns.put(name, conn);

				try {
					updateUser(user.name, null, null, null, null, null, getTimestamp(), "1");
				} catch (IOException ex) {
					return new Response(RESPONSE_TYPES.ERROR, ex.getMessage(), null, null);
				}

				return
					new Response(
						RESPONSE_TYPES.OK,
						"User is successfully logged in.",
						user,
						new Notify(this, name, null, RESPONSE_TYPES.USER_LOGIN)
					);
			}
			return new Response(RESPONSE_TYPES.ERROR, "Invalid password!", null, null);
		}
		return new Response(RESPONSE_TYPES.ERROR, "Invalid user!", null, null);
	}

	/**
	 * @param   name
	 *
	 * @return  Response
	 */
	private Response logoutUser(String name) {
		WebSocket conn = conns.get(name);
		if (conn != null) {
			conns.remove(name);

			User user = findUser(name);
			user.status = "0";

			return
				new Response(
					RESPONSE_TYPES.OK,
					"User is successfully logged out.",
					user,
					new Notify(this, name, null, RESPONSE_TYPES.USER_LOGOUT)
				);
		}
		return new Response(RESPONSE_TYPES.ERROR, "Invalid user!", null, null);
	}

	/**
	 * @throws  IOException
	 */
	private void readUsers() throws IOException {
		users.clear();
		try(BufferedReader br = new BufferedReader(new FileReader(root + USERS_DB))) {
			for (String line; (line = br.readLine()) != null;) {
				users.add(new User(line));
			}
			br.close();
		} catch (IOException ex) {
			throw ex;
		}
	}

	/**
	 * @throws  IOException
	 */
	private void writeUsers() throws IOException {
		try(BufferedWriter writer = new BufferedWriter(new FileWriter(root + USERS_DB));
		) {
			for (User user : users) {
				writer.write(user.toLine() + System.lineSeparator());
			}
			writer.close();
		} catch (IOException ex) {
			throw ex;
		}
	}

	/**
	 * @param   name
	 *
	 * @return  User
	 */
	private User findUser(String name) {
		for (User user : users) {
			if (user.name.equals(name)) {
				return user;
			}
		}
		return null;
	}

	/**
	 * @param   name
	 *
	 * @return  Response
	 */
	private Response getUser(String name) {
		User user = findUser(name);
		return
			user != null ? new Response(RESPONSE_TYPES.OK, "The user was readed successfully.", user, null)
			: new Response(RESPONSE_TYPES.ERROR, "The user was not found.", null, null);
	}

	/**
	 * @param   name
	 * @param   password
	 * @param   email
	 * @param   avatar
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response createUser(String name, String password, String email, String avatar) throws IOException {
		User user = findUser(name);
		if (user == null) {
			user = new User(name, password, null, email, avatar, null, null, "", "0");
			users.add(user);
			writeUsers();
			return new Response(RESPONSE_TYPES.OK, "The user was created successfully.", user, null);
		}
		return new Response(RESPONSE_TYPES.ERROR, "The user already exists.", null, null);
	}

	/**
	 * @param   name
	 * @param   password
	 * @param   email
	 * @param   avatar
	 * @param   contacts
	 * @param   groups
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response updateUser(
		String name,
		String password,
		String email,
		String avatar,
		String contacts,
		String groups,
		String time,
		String status
	) throws IOException
	{
		User user = findUser(name);
		if (user != null) {
			user.update(name, password, email, avatar, contacts, groups, time, status);
			writeUsers();
		}

		return
			user != null
			? new Response(
				RESPONSE_TYPES.OK,
				"The user was updated successfully.",
				user,
				new Notify(this, name, null, RESPONSE_TYPES.USER_UPDATED)
			) : new Response(RESPONSE_TYPES.ERROR, "The user could not be updated.", null, null);
	}

	/**
	 * @param   name
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response deleteUser(String name) throws IOException {
		User user = findUser(name);
		if (user != null) {
			users.remove(user);
			removeContactFromUsers(name);
			removeUserFromGroups(name);
			removeUserChats(name);
			writeUsers();
		}
		return
			user != null ? new Response(RESPONSE_TYPES.OK, "The user was deleted successfully.", user, null)
			: new Response(RESPONSE_TYPES.ERROR, "The user could not be found.", null, null);
	}

	/**
	 * @param   name
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response getUserContacts(String name) throws IOException {
		List<User> contacts = new ArrayList<User>();
		User user = findUser(name);
		if (user != null) {
			for (String c : user.contacts) {
				User contact = findUser(c);
				if (contact != null) {
					contacts.add(contact);
				}
			}
		}
		return new Response(RESPONSE_TYPES.OK, "Contacts were loaded successfully.", contacts, null);
	}

	/**
	 * @param   name
	 * @param   contact
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response addUserContact(String name, String contact) throws IOException {
		User user = findUser(name);
		if (user != null && !user.contacts.contains(contact)) {
			user.contacts.add(contact);
			writeUsers();
			return new Response(RESPONSE_TYPES.OK, "The contact was added to the user successfully.", user, null);
		}
		return new Response(RESPONSE_TYPES.ERROR, "The contact could not be added to the user.", null, null);
	}

	/**
	 * @param   name
	 * @param   contact
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response removeUserContact(String name, String contact) throws IOException {
		User user = findUser(name);
		if (user != null && user.contacts.contains(contact)) {
			user.contacts.remove(contact);
			writeUsers();
			return new Response(RESPONSE_TYPES.OK, "The contact was removed from the user successfully.", user, null);
		}

		return new Response(RESPONSE_TYPES.ERROR, "The contact could not be removed from the user.", null, null);
	}

	/**
	 * @param   name
	 * @param   own
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response getUserGroups(String name, boolean own) throws IOException {
		List<Group> grps = new ArrayList<Group>();
		User user = findUser(name);
		if (user != null) {
			for (String g : user.groups) {
				Group group = findGroup(g);
				if (group != null) {
					if (own) {
						if (group.owner.equals(name)) {
							grps.add(group);
						}
					} else {
						grps.add(group);
					}
				}
			}
		}
		return new Response(RESPONSE_TYPES.OK, "Groups were loaded successfully.", grps, null);
	}

	/**
	 * @param   name
	 * @param   group
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response addUserGroup(String name, String group) throws IOException {
		User user = findUser(name);
		if (user != null && !user.groups.contains(group)) {
			user.groups.add(group);
			writeUsers();
			return new Response(RESPONSE_TYPES.OK, "The group was added to the user successfully.", user, null);
		}

		return new Response(RESPONSE_TYPES.ERROR, "The group could not be added to the user.", null, null);
	}

	/**
	 * @param   name
	 * @param   group
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response removeUserGroup(String name, String group) throws IOException {
		User user = findUser(name);
		if (user != null && user.groups.contains(group)) {
			user.groups.remove(group);
			writeUsers();
			return new Response(RESPONSE_TYPES.OK, "The group was removed from the user successfully.", user, null);
		}

		return new Response(RESPONSE_TYPES.ERROR, "The group could not be removed from the user.", null, null);
	}

	/**
	 * @param   name
	 *
	 * @return  boolean
	 *
	 * @throws  IOException
	 */
	private boolean removeContactFromUsers(String name) throws IOException {
		boolean update = false;
		for (User user : users) {
			if (user.contacts.contains(name)) {
				user.contacts.remove(name);
				update = true;
			}
		}
		if (update) {
			writeUsers();
			return true;
		}
		return false;
	}

	/**
	 * @param   name
	 *
	 * @return  boolean
	 *
	 * @throws  IOException
	 */
	private boolean removeGroupFromUsers(String name) throws IOException {
		boolean update = false;
		for (User user : users) {
			if (user.groups.contains(name)) {
				user.groups.remove(name);
				update = true;
			}
		}
		if (update) {
			writeUsers();
			return true;
		}
		return false;
	}

	//==== GROUPS ====

	/**
	 * @throws  IOException
	 */
	private void readGroups() throws IOException {
		groups.clear();
		try(BufferedReader br = new BufferedReader(new FileReader(root + GROUPS_DB))) {
			for (String line; (line = br.readLine()) != null;) {
				groups.add(new Group(line));
			}
			br.close();
		} catch (IOException ex) {
			throw ex;
		}
	}

	/**
	 * @throws  IOException
	 */
	private void writeGroups() throws IOException {
		try(BufferedWriter writer = new BufferedWriter(new FileWriter(root + GROUPS_DB));
		) {
			for (Group group : groups) {
				writer.write(group.toLine() + System.lineSeparator());
			}
			writer.close();
		} catch (IOException ex) {
			throw ex;
		}
	}

	/**
	 * @param   name
	 *
	 * @return  Group
	 */
	private Group findGroup(String name) {
		for (Group group : groups) {
			if (group.name.equals(name)) {
				return group;
			}
		}
		return null;
	}

	/**
	 * @param   name
	 *
	 * @return  User
	 */
	private Response getGroup(String name) {
		Group group = findGroup(name);
		return
			group != null ? new Response(RESPONSE_TYPES.OK, "The group was readed successfully.", group, null)
			: new Response(RESPONSE_TYPES.ERROR, "The group was not found.", null, null);
	}

	/**
	 * @param   name
	 * @param   avatar
	 * @param   owner
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response createGroup(String name, String avatar, String owner) throws IOException {
		Group group = findGroup(name);
		if (group == null) {
			group = new Group(name, avatar, owner, null, "");
			groups.add(group);
			writeGroups();

			return new Response(RESPONSE_TYPES.OK, "The new group was created successfully.", group, null);
		}

		return new Response(RESPONSE_TYPES.ERROR, "The group already exists.", null, null);
	}

	/**
	 * @param   name
	 * @param   avatar
	 * @param   owner
	 * @param   members
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response updateGroup(String name, String avatar, String owner, String members) throws IOException {
		Group group = findGroup(name);
		if (group != null) {
			group.update(name, avatar, owner, members);
			writeGroups();
			return new Response(RESPONSE_TYPES.OK, "The group was updated successfully.", group, null);
		}
		return new Response(RESPONSE_TYPES.ERROR, "The group could not be updated.", null, null);
	}

	/**
	 * @param   name
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response deleteGroup(String name) throws IOException {
		Group group = findGroup(name);
		if (group != null) {
			groups.remove(group);
			removeGroupFromUsers(name);
			writeGroups();
			return new Response(RESPONSE_TYPES.OK, "The group was deleted successfully.", null, null);
		}

		return new Response(RESPONSE_TYPES.ERROR, "The group could not be deleted.", null, null);
	}

	/**
	 * @param   name
	 * @param   member
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response addToGroup(String name, String member) throws IOException {
		Group group = findGroup(name);
		if (group != null && !group.members.contains(member)) {
			group.members.add(member);
			writeGroups();
			addUserGroup(member, name);
			return new Response(RESPONSE_TYPES.OK, "The user was added to the group successfully.", group, null);
		}

		return new Response(RESPONSE_TYPES.ERROR, "The user could not be added to the group.", null, null);
	}

	/**
	 * @param   name
	 * @param   member
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response removeFromGroup(String name, String member) throws IOException {
		Group group = findGroup(name);
		if (group != null && group.members.contains(member)) {
			group.members.remove(member);
			writeGroups();
			removeUserGroup(member, name);
			return new Response(RESPONSE_TYPES.OK, "The user was removed from the group successfully.", group, null);
		}

		return new Response(RESPONSE_TYPES.ERROR, "The user could not be removed from the group.", null, null);
	}

	/**
	 * @param   name
	 *
	 * @return  boolean
	 *
	 * @throws  IOException
	 */
	private boolean removeUserFromGroups(String name) throws IOException {
		boolean update = false;
		for (Group group : groups) {
			if (group.members.contains(name)) {
				group.members.remove(name);
				update = true;
			}
		}
		if (update) {
			writeGroups();
			return true;
		}
		return false;
	}

	/**
	 * @param   name
	 *
	 * @return  boolean
	 *
	 * @throws  IOException
	 */
	private boolean removeUserChats(String name) throws IOException {

		// @TODO
		return false;
	}

	/**
	 * @param   name
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response getChannel(String name) throws IOException {
		boolean found = false;
		User user = findUser(name);
		Map<String, String> channel = new HashMap<String, String>();

		if (user != null) {
			found = true;
			channel.put("name", user.name);
			channel.put("email", user.email);
			channel.put("avatar", user.avatar);
			channel.put("time", user.time);
			channel.put("status", user.status);
			channel.put("isUser", "true");
		} else {
			Group group = findGroup(name);
			if (group != null) {
				found = true;
				channel.put("name", group.name);
				channel.put("email", "");
				channel.put("avatar", group.avatar);
				channel.put("time", group.time);
				channel.put("status", "");
				channel.put("isUser", "false");
			}
		}

		return
			new Response(
				found ? RESPONSE_TYPES.OK : RESPONSE_TYPES.ERROR,
				found ? "Channel found" : "Channel not found!",
				channel,
				null
			);
	}

	//==== CHAT ====

	/**
	 * @param   user
	 * @param   channel
	 * @param   time
	 * @param   count
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response readChat(String user, String channel, String time, int pos, int count) throws IOException {

		List<Chat> chats = new ArrayList<Chat>();
		List<Chat> toBeUpdateChats = new ArrayList<Chat>();
		BufferedReader br = new BufferedReader(new FileReader(root + CHATS_DB));

		for (String line; (line = br.readLine()) != null;) {

			Chat chat = new Chat(line);

			boolean ok = Long.parseLong(chat.time) > Long.parseLong(time);

			if (ok) {
				Group group = findGroup(channel);
				if (group != null) {
					ok = group.members.contains(user) && chat.channel.equals(channel);
				} else {
					ok =
						(chat.user.equals(user) && chat.channel.equals(channel))
						|| (chat.channel.equals(user) && chat.user.equals(channel));
				}
				if (ok) {
					chats.add(chat);
					if (chat.state == 1) {
						if (chat.channel.equals(user) || group != null) {
							toBeUpdateChats.add(chat);
						}
					}
				}
			} else if (chat.state == 1 && chat.channel.equals(user)) {
				toBeUpdateChats.add(chat);
			}
		}
		br.close();

		if (!toBeUpdateChats.isEmpty()) {
			for (Chat c : toBeUpdateChats) {
				c.state = 2;
				updateChat(c.user, c.channel, c.text, c.file, c.time, c.state, true, false);
			}
			for (Chat c : toBeUpdateChats) {
				new Notify(this, null, c, RESPONSE_TYPES.CHAT_UPDATED).doNotify();
			}
		}

		//=== sending only part of chats ===

		if (pos == 0) {
			pos = chats.size();
		}
		if (count > chats.size()) {
			count = chats.size();
		}
		if (pos < count) {
			count = pos;
		}
		List<Chat> s_chats = new ArrayList<Chat>();
		for (int i = 0; i < count; i++) {
			s_chats.add(chats.get(pos - count + i));
		}

		return
			new Response(RESPONSE_TYPES.OK, "[" + (pos - count) + "] Chats were loaded successfully.", s_chats, null);
	}

	/**
	 * @param   user
	 * @param   channel
	 * @param   text
	 * @param   file
	 * @param   time
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response writeChat(String user, String channel, String text, String file, String time) throws IOException {
		BufferedWriter writer = new BufferedWriter(new FileWriter(root + CHATS_DB, true));

		Chat chat = new Chat(user, channel, text, file, time, 1, false);

		writer.write(chat.toLine() + System.lineSeparator());
		writer.close();

		return
			new Response(
				RESPONSE_TYPES.OK,
				"Chat was written successfully.",
				chat,
				new Notify(this, null, chat, RESPONSE_TYPES.CHAT_SENT)
			);
	}

	/**
	 * @param   user
	 * @param   channel
	 * @param   text
	 * @param   file
	 * @param   state
	 * @param   time
	 * @param   onlyState
	 * @param   notify
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response updateChat(
		String  user,
		String  channel,
		String  text,
		String  file,
		String  time,
		int		state,
		boolean onlyState,
		boolean notify
	) throws IOException
	{
		Chat chat = null;
		File dbFile = new File(root + CHATS_DB);
		File tmFile = new File(root + CHATS_DB + ".tmp");
		BufferedReader br = new BufferedReader(new FileReader(dbFile));
		BufferedWriter wr = new BufferedWriter(new FileWriter(tmFile));

		for (String line; (line = br.readLine()) != null;) {
			Chat c = new Chat(line);
			if (c.user.equals(user) && c.time.equals(time)) {
				chat = new Chat(user, channel, text, file, time, state, false);
				wr.write(chat.toLine() + System.lineSeparator());
				continue;
			}
			wr.write(line + System.lineSeparator());
		}
		wr.close();
		br.close();

		if (chat != null) {
			dbFile.delete();
			tmFile.renameTo(dbFile);

			if (notify) {
				return
					new Response(
						RESPONSE_TYPES.OK,
						"Chat was updated successfully.",
						null,
						new Notify(
							this,
							null,
							chat,
							onlyState ? RESPONSE_TYPES.CHAT_RECEIVED : RESPONSE_TYPES.CHAT_UPDATED
						)
					);
			}
		}
		return new Response(RESPONSE_TYPES.ERROR, "Chat could not be updated.", null, null);
	}

	/**
	 * @param   user
	 * @param   time
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response deleteChat(String user, String time) throws IOException {

		Chat chat = null;

		File dbFile = new File(root + CHATS_DB);
		File tmFile = new File(root + CHATS_DB + ".tmp");
		BufferedReader br = new BufferedReader(new FileReader(dbFile));
		BufferedWriter wr = new BufferedWriter(new FileWriter(tmFile));

		for (String line; (line = br.readLine()) != null;) {
			Chat c = new Chat(line);
			if (c.user.equals(user) && c.time.equals(time)) {
				chat = c;
				continue;
			}
			wr.write(line + System.lineSeparator());
		}
		wr.close();
		br.close();

		if (chat != null) {
			if (dbFile.delete()) {
				if (tmFile.renameTo(dbFile)) {
					if (chat.file != null && !chat.file.isEmpty()) {
						File f = new File(root + "/db/files/chats/" + chat.file);
						if (f.exists()) {
							f.delete();
						}
					}

					return
						new Response(
							RESPONSE_TYPES.OK,
							"Chat was deleted successfully.",
							null,
							new Notify(this, null, chat, RESPONSE_TYPES.CHAT_DELETED)
						);
				}
			}
		}

		return new Response(RESPONSE_TYPES.ERROR, "Chat could not be deleted.", null, null);
	}

	/**
	 * @param   user
	 * @param   channel
	 * @param   time
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response forwardChat(String user, String channel, String time) throws IOException {

		File dbFile = new File(root + CHATS_DB);
		BufferedReader br = new BufferedReader(new FileReader(dbFile));

		if (findUser(user) != null && findUser(channel) != null) {

			for (String line; (line = br.readLine()) != null;) {
				Chat c = new Chat(line);
				if (c.time.equals(time)) {
					if (c.user.equals(user) || c.channel.equals(user)) {
						c.user = user;
						c.channel = channel;
						writeChat(c.user, c.channel, c.text, c.file, getTimestamp());
						br.close();
						return
							new Response(
								RESPONSE_TYPES.OK,
								"Chat was forewarded successfully.",
								null,
								new Notify(this, null, c, RESPONSE_TYPES.CHAT_SENT)
							);
					}
				}
			}
			br.close();
		}

		return new Response(RESPONSE_TYPES.ERROR, "Chat could not be forwarded.", null, null);
	}

	/**
	 * @param   name
	 *
	 * @return  Response
	 *
	 * @throws  IOException
	 */
	private Response downloadFile(String name) throws IOException {

		Response response = null;
		String nl = name.toLowerCase();
		String format =
			nl.endsWith("png") ? "png"
			: nl.endsWith("jpg") ? "jpg" : nl.endsWith("jpeg") ? "jpeg" : nl.endsWith("gif") ? "gif" : null;

		if (format != null) {
			BufferedImage bImage = ImageIO.read(new File(root + "/db/files/chats/" + name));
			ByteArrayOutputStream bos = new ByteArrayOutputStream();
			ImageIO.write(bImage, format, bos);
			bos.flush();
			byte[] imageInByte = bos.toByteArray();
			bos.close();
			response =
				new Response(
					RESPONSE_TYPES.OK,
					"The file was loaeded successfully.",
					ByteBuffer.wrap(imageInByte),
					null
				);
		} else {
			// @todo
		}

		return response;
	}

	/**
	 * @param   user
	 * @param   channel
	 * @param   time
	 *
	 * @return  List<Chat>
	 *
	 * @throws  IOException
	 */
	@SuppressWarnings("unused")
	private Chat findChat(String user, String channel, String time) throws IOException {

		BufferedReader br = new BufferedReader(new FileReader(root + CHATS_DB));

		Chat chat = null;
		for (String line; (line = br.readLine()) != null;) {

			Chat c = new Chat(line);
			if (c.user.equals(user) && c.channel.equals(channel) && c.time.equals(time)) {
				chat = c;
				break;
			}
		}
		br.close();
		return chat;
	}

	//==== MIX ====

	/**
	 * @param   name
	 * @param   buffer
	 * @param   isAvatar
	 *
	 * @throws  IOException
	 */
	private void saveImage(String user, String channel, String name, ByteBuffer buffer, boolean isAvatar)
		throws IOException
	{
		File file = new File(root + "/db/files/" + (isAvatar ? "avatar/" : "chats/") + name);
		if (file.exists()) {
			file.delete();
		}
		file.createNewFile();

		FileOutputStream fo = new FileOutputStream(file, false);
		FileChannel fc = fo.getChannel();
		fc.write(ByteBuffer.wrap(buffer.array()));
		fc.close();
		fo.close();
	}

	/**
	 * @param   object
	 *
	 * @return  String
	 */
	private static String toJSON(Object object) {
		Gson gson = new GsonBuilder().setPrettyPrinting().create();
		String json = gson.toJson(object);
		return json;
	}

	/**
	 * @param   json
	 *
	 * @return  LinkedTreeMap<String, String>
	 */
	private static LinkedTreeMap<String, String> fromJSON(String json) {

		TypeToken<LinkedTreeMap<String, String>> typeToken =
			new TypeToken<LinkedTreeMap<String, String>>() {
			};

		LinkedTreeMap<String, String> js = new GsonBuilder().create().fromJson(json, typeToken.getType());

//      for (Map.Entry<String, String> entry : js.entrySet()) {
//          String key = entry.getKey();
//          String value = entry.getValue();
//          System.out.println(key + " => " + value);
//      }

		return js;
	}

	private static String getTimestamp() {
		Long stamp = new Date().getTime();
		return stamp.toString();
	}

	//=============================

	/**
	 * @param  username
	 * @param  chat
	 * @param  state
	 */
	private void notifyChannels(String username, Chat chat, RESPONSE_TYPES state) {

		switch (state) {

			case OK :
			case ERROR :
			case CONN_OPENED :
				break;

			case CONN_CLOSED :
			case USER_LOGIN :
			case USER_LOGOUT : {
				User user = findUser(username);

				WebSocket conn = conns.get(username);
				if (conn != null) { // update self
					new Response(state, "doUpdate", user, null).send(conn);
				}

				for (User us : users) {
					if (us.contacts.contains(username)) {
						conn = conns.get(us.name);
						if (conn != null && conn.isOpen()) {
							new Response(state, "doUpdate", user, null).send(conn);
						}
					}
				}
				for (String g : user.groups) {
					Group group = findGroup(g);
					if (group != null) {
						for (String mem : group.members) {
							if (!mem.equals(username)) {
								conn = conns.get(mem);
								if (conn != null && conn.isOpen()) {
									new Response(state, "doUpdate", user, null).send(conn);
								}
							}
						}
					}
				}
				break;
			}

			case USER_UPDATED : {
				User user = findUser(username);
				WebSocket conn = conns.get(username);
				if (conn != null && conn.isOpen()) {
					new Response(state, "doUpdate", user, null).send(conn);
				}

				for (String c : user.contacts) {
					conn = conns.get(c);
					if (conn != null && conn.isOpen()) {
						new Response(state, "doUpdate", user, null).send(conn);
					}
				}
				for (String g : user.groups) {
					Group group = findGroup(g);
					if (group != null) {
						for (String mem : group.members) {
							if (!mem.equals(username)) {
								conn = conns.get(mem);
								if (conn != null && conn.isOpen()) {
									new Response(state, "doUpdate", user, null).send(conn);
								}
							}
						}
					}
				}
				break;
			}

			case CHAT_SENT : {
				Group group = findGroup(chat.channel);
				if (group != null) {
					for (String mem : group.members) {
						if (!mem.equals(chat.user)) {
							WebSocket conn = conns.get(mem);
							if (conn != null && conn.isOpen()) {
								chat.broadcast = true;
								new Response(state, "doUpdate", chat, null).send(conn);
							}
						}
					}
				} else {
					WebSocket conn = conns.get(chat.channel);
					if (conn != null && conn.isOpen()) {
						new Response(state, "doUpdate", chat, null).send(conn);
					}
				}
				break;
			}

			case CHAT_DELETED : {
				Group group = findGroup(chat.channel);
				if (group != null) {
					for (String mem : group.members) {
						if (!mem.equals(chat.user)) {
							WebSocket conn = conns.get(mem);
							if (conn != null && conn.isOpen()) {
								new Response(state, "doUpdate", chat, null).send(conn);
							}
						}
					}
				} else {
					WebSocket conn = conns.get(chat.channel);
					if (conn != null && conn.isOpen()) {
						new Response(state, "doUpdate", chat, null).send(conn);
					}
				}
				break;
			}

			case CHAT_RECEIVED :
			case CHAT_UPDATED : {
				Group group = findGroup(chat.channel);
				if (group != null) {
					for (String mem : group.members) {
						WebSocket conn = conns.get(mem);
						if (conn != null && conn.isOpen()) {
							new Response(state, "doUpdate", chat, null).send(conn);
						}
					}
				} else {
					WebSocket conn = conns.get(chat.user);
					if (conn != null && conn.isOpen()) {
						new Response(state, "doUpdate", chat, null).send(conn);
					}
				}
				break;
			}

		}
	}

	/**
	 * @param   request
	 *
	 * @return  Response
	 */
	private Response handleRequest(Request request) {

		if (isActive) {
			new RequestHandler(this, request);
			return null;
		}

		isActive = true;

		request.print();

		Response response = null;

		try {

			if (request.buffer != null) {
				if (fileUser != null) {
					try {

						saveImage(fileUser, fileChannel, fileName, request.buffer, fileIsAvatar);
						fileUser = null;
						response = new Response(RESPONSE_TYPES.OK, "File was uploaded successfully.", null, null);

					} catch (Exception ex) {
						ex.printStackTrace();
						response = new Response(RESPONSE_TYPES.ERROR, ex.getMessage(), null, null);
					}
				}

			} else {
				if (REQUEST_TYPES.InitUsers.isEqual(request.type)) {
					readUsers();

				} else if (REQUEST_TYPES.InitGroups.isEqual(request.type)) {
					readGroups();

				} else if (REQUEST_TYPES.Open.isEqual(request.type)) {
					response = open(request.conn);

				} else if (REQUEST_TYPES.Close.isEqual(request.type)) {
					response = close(request.conn);

				} else if (REQUEST_TYPES.Login.isEqual(request.type)) {
					response = loginUser(request.conn, request.get("name"), request.get("password"), false);

				} else if (REQUEST_TYPES.LoginCookie.isEqual(request.type)) {
					response = loginUser(request.conn, request.get("name"), null, true);

				} else if (REQUEST_TYPES.Logout.isEqual(request.type)) {
					response = logoutUser(request.get("name"));

				} else if (REQUEST_TYPES.GetUser.isEqual(request.type)) {
					response = getUser(request.get("name"));

				} else if (REQUEST_TYPES.GetGroup.isEqual(request.type)) {
					response = getGroup(request.get("name"));

				} else if (REQUEST_TYPES.GetAllUsers.isEqual(request.type)) {
					readUsers();
					response = new Response(RESPONSE_TYPES.OK, "Users were loaded successfully.", users, null);

				} else if (REQUEST_TYPES.GetAllGroups.isEqual(request.type)) {
					readGroups();
					response = new Response(RESPONSE_TYPES.OK, "Groups were loaded successfully.", groups, null);

				} else if (REQUEST_TYPES.GetGroups.isEqual(request.type)) {
					String og = request.get("ownGroups");
					boolean own = og == null ? true : Boolean.parseBoolean(og);
					response = getUserGroups(request.get("name"), own);

				} else if (REQUEST_TYPES.CreateUser.isEqual(request.type)) {
					response =
						createUser(
							request.get("name"),
							request.get("password"),
							request.get("email"),
							request.get("avatar")
						);

				} else if (REQUEST_TYPES.DeleteUser.isEqual(request.type)) {
					response = deleteUser(request.get("name"));

				} else if (REQUEST_TYPES.UpdateUser.isEqual(request.type)) {
					response =
						updateUser(
							request.get("name"),
							request.get("password"),
							request.get("email"),
							request.get("avatar"),
							request.get("contacts"),
							request.get("groups"),
							null,
							null
						);

				} else if (REQUEST_TYPES.GetContacts.isEqual(request.type)) {
					response = getUserContacts(request.get("name"));

				} else if (REQUEST_TYPES.AddContact.isEqual(request.type)) {
					response = addUserContact(request.get("name"), request.get("contact"));

				} else if (REQUEST_TYPES.RemoveContact.isEqual(request.type)) {
					response = removeUserContact(request.get("name"), request.get("contact"));

				} else if (REQUEST_TYPES.AddGroup.isEqual(request.type)) {
					response = addUserGroup(request.get("name"), request.get("group"));

				} else if (REQUEST_TYPES.RemoveGroup.isEqual(request.type)) {
					response = removeUserGroup(request.get("name"), request.get("group"));

				} else if (REQUEST_TYPES.CreateGroup.isEqual(request.type)) {
					response = createGroup(request.get("name"), request.get("avatar"), request.get("owner"));

				} else if (REQUEST_TYPES.UpdateGroup.isEqual(request.type)) {
					response =
						updateGroup(
							request.get("name"),
							request.get("avatar"),
							request.get("owner"),
							request.get("members")
						);

				} else if (REQUEST_TYPES.DeleteGroup.isEqual(request.type)) {
					response = deleteGroup(request.get("name"));

				} else if (REQUEST_TYPES.AddToGroup.isEqual(request.type)) {
					response = addToGroup(request.get("name"), request.get("member"));

				} else if (REQUEST_TYPES.RemoveFromGroup.isEqual(request.type)) {
					response = removeFromGroup(request.get("name"), request.get("member"));

				} else if (REQUEST_TYPES.GetChannel.isEqual(request.type)) {
					response = getChannel(request.get("name"));

				} else if (REQUEST_TYPES.ReadChat.isEqual(request.type)) {
					response =
						readChat(
							request.get("user"),
							request.get("channel"),
							request.get("time"),
							Integer.parseInt(request.get("pos")),
							Integer.parseInt(request.get("count"))
						);

				} else if (REQUEST_TYPES.WriteChat.isEqual(request.type)) {
					response =
						writeChat(
							request.get("user"),
							request.get("channel"),
							request.get("text"),
							request.get("file"),
							request.get("time")
						);

				} else if (REQUEST_TYPES.DeleteChat.isEqual(request.type)) {
					response = deleteChat(request.get("user"), request.get("time"));

				} else if (REQUEST_TYPES.UpdateChat.isEqual(request.type)) {
					response =
						updateChat(
							request.get("user"),
							request.get("channel"),
							request.get("text"),
							request.get("file"),
							request.get("time"),
							Integer.parseInt(request.get("state")),
							false,
							true
						);

				} else if (REQUEST_TYPES.ReceivedChat.isEqual(request.type)) {
					response =
						updateChat(
							request.get("user"),
							request.get("channel"),
							request.get("text"),
							request.get("file"),
							request.get("time"),
							2,
							true,
							true
						);

				} else if (REQUEST_TYPES.ForwardChat.isEqual(request.type)) {
					response = forwardChat(request.get("user"), request.get("channel"), request.get("time"));

				} else if (REQUEST_TYPES.DownloadFile.isEqual(request.type)) {
					response = downloadFile(request.get("name"));

				} else if (REQUEST_TYPES.UploadFile.isEqual(request.type)) {
					fileUser = request.get("user");
					fileName = request.get("name");
					fileIsAvatar = request.get("avatar").equals("true");
					response = new Response(RESPONSE_TYPES.OK, "Ready", null, null);

				} else if (REQUEST_TYPES.ResetPassword.isEqual(request.type)) {
					response = resetPassword(request.get("name"), request.get("email"));

				} else if (REQUEST_TYPES.Reboot.isEqual(request.type)) {
					response = reboot(request.conn, request.get("name"), request.get("password"));
				} else {
					response = new Response(RESPONSE_TYPES.ERROR, "Unknown type!", null, null);
				}
			}
		} catch (Exception ex) {
			log.error(ex.getMessage(), ex);
			response = new Response(RESPONSE_TYPES.ERROR, ex.getMessage(), null, null);
		}

		if (response != null && request.conn != null && request.conn.isOpen()) {
			response.send(request.conn);
		}

		isActive = false;

		return response;
	}

	/**
	 * @param   username
	 * @param   email
	 *
	 * @return  Response
	 */
	private Response resetPassword(String username, String email) {
		User user = findUser(username);

		if (user != null) {

			if (user.email.equals(email)) {
				try {
					user.update(username, "12345678", null, null, null, null, null, null);
					writeUsers();
					famchat.sendEmail(email);

					return
						new Response(
							RESPONSE_TYPES.OK,
							"Your password has been reset.\n"
							+ "The new password was sent by email to your email address.",
							user,
							null
						);

				} catch (Exception ex) {
					return
						new Response(
							RESPONSE_TYPES.ERROR,
							"Could not reset the user password!\n"
							+ ex.getMessage(),
							null,
							null
						);
				}
			} else {
				return
					new Response(RESPONSE_TYPES.ERROR, "The entered email does not match the user's email", null, null);
			}
		}
		return new Response(RESPONSE_TYPES.ERROR, "The user could not be found.", null, null);
	}

	/**
	 * @param   conn
	 * @param   name
	 * @param   password
	 *
	 * @return  Response
	 */
	private Response reboot(WebSocket conn, String name, String password) {
		User user = findUser(name);
		if (name.equals(ADMIN) && user != null) {
			if (PasswordUtils.verifyUserPassword(password, user.password, user.salt)) {
				famchat.reboot();
				return null;
			}
		}
		return new Response(RESPONSE_TYPES.ERROR, "Could not reboot the server!", null, null);
	}

	//=============================

	/**
	 * Representation of chat user
	 *
	 * @author  P203125
	 */
	class User {
		String name;
		String password;
		String salt;
		String email;
		String avatar;
		List<String> contacts;
		List<String> groups;
		String time;
		String status;

		public User(
			String		 name,
			String		 password,
			String		 salt,
			String		 email,
			String		 avatar,
			List<String> contacts,
			List<String> groups,
			String		 time,
			String		 status
		) {
			this.name = name;
			this.salt = PasswordUtils.getSalt(30);
			this.password = PasswordUtils.generateSecurePassword(password, this.salt);
			this.email = email;
			this.avatar = avatar;
			this.contacts = contacts == null ? new ArrayList<String>() : contacts;
			this.groups = groups == null ? new ArrayList<String>() : groups;
			this.time = getTimestamp();
			this.status = "0";
		}

		User(String... args) {
			this.name = args.length > 0 ? args[0] : null;
			this.salt = PasswordUtils.getSalt(30);
			this.password = args.length > 1 ? PasswordUtils.generateSecurePassword(args[1], this.salt) : null;
			this.email = args.length > 2 ? args[2] : null;
			this.avatar = args.length > 3 ? args[3] : null;
			this.contacts =
				args.length > 4 ? new ArrayList<String>(Arrays.asList(args[4].split("[" + SEPERATUG + "]")))
				: new ArrayList<String>();
			this.groups =
				args.length > 5 ? new ArrayList<String>(Arrays.asList(args[5].split("[" + SEPERATUG + "]")))
				: new ArrayList<String>();
			this.time = args.length > 6 ? args[6] : null;
			this.status = "0";
		}

		User(String line) {
			fromLine(line);
		}

		void update(
			String name,
			String password,
			String email,
			String avatar,
			String contacts,
			String groups,
			String time,
			String status
		) {
			this.name = name;

			if (password != null) {
				this.salt = PasswordUtils.getSalt(30);
				this.password = PasswordUtils.generateSecurePassword(password, this.salt);
			}
			if (email != null) {
				this.email = email;
			}
			if (avatar != null) {
				this.avatar = avatar;
			}
			if (contacts != null) {
				this.contacts = new ArrayList<String>(Arrays.asList(contacts.split("[" + SEPERATUG + "]")));
			}
			if (groups != null) {
				this.groups = new ArrayList<String>(Arrays.asList(groups.split("[" + SEPERATUG + "]")));
			}
			if (time != null) {
				this.time = time;
			}
			if (status != null) {
				this.status = status;
			}
		}

		String toLine() {
			String co = "", gr = "";
			for (int i = 0; i < contacts.size(); i++) {
				co += contacts.get(i)
					+ (i < contacts.size() - 1 ? SEPERATUG : "");
			}
			for (int i = 0; i < groups.size(); i++) {
				gr += groups.get(i)
					+ (i < groups.size() - 1 ? SEPERATUG : "");
			}
			String ln =
				name
				+ SEPERATOR
				+ password
				+ SEPERATOR
				+ salt
				+ SEPERATOR
				+ email
				+ SEPERATOR
				+ avatar
				+ SEPERATOR
				+ co
				+ SEPERATOR
				+ gr
				+ SEPERATOR
				+ time;

			return ln;
		}

		void fromLine(String line) {
			String[] s = line.split(Pattern.quote(SEPERATOR));
			if (s.length == 8) {
				name = s[0];
				password = s[1];
				salt = s[2];
				email = s[3];
				avatar = s[4];
				contacts = new ArrayList<String>(Arrays.asList(s[5].split("[" + SEPERATUG + "]")));
				groups = new ArrayList<String>(Arrays.asList(s[6].split("[" + SEPERATUG + "]")));
				time = s[7];
				status = "0";
			}
		}
	}

	/**
	 * Representation of chat group
	 *
	 * @author  P203125
	 */
	class Group {
		String name;
		String avatar;
		String owner;
		List<String> members;
		String time;

		public Group(String name, String avatar, String owner, List<String> members, String time) {
			this.name = name;
			this.avatar = avatar;
			this.owner = owner;
			this.members = members == null ? new ArrayList<String>() : members;
			this.time = getTimestamp();
		}

		Group(String... args) {
			this.name = args.length > 0 ? args[0] : null;
			this.avatar = args.length > 1 ? args[1] : null;
			this.owner = args.length > 2 ? args[2] : null;
			this.members =
				args.length > 3 ? new ArrayList<String>(Arrays.asList(args[3].split("[" + SEPERATUG + "]")))
				: new ArrayList<String>();
			this.time = args.length > 4 ? args[4] : null;
		}

		Group(String line) {
			fromLine(line);
		}

		String toLine() {
			String me = "";
			for (int i = 0; i < members.size(); i++) {
				me += members.get(i)
					+ (i < members.size() - 1 ? SEPERATUG : "");
			}
			String ln = name
				+ SEPERATOR
				+ avatar
				+ SEPERATOR
				+ owner
				+ SEPERATOR
				+ me
				+ SEPERATOR
				+ time;
			return ln;
		}

		void fromLine(String line) {
			String[] s = line.split(Pattern.quote(SEPERATOR));
			if (s.length == 5) {
				name = s[0];
				avatar = s[1];
				owner = s[2];
				members = new ArrayList<String>(Arrays.asList(s[3].split("[" + SEPERATUG + "]")));
				time = s[4];
			}
		}

		void update(String name, String avatar, String owner, String members) {
			this.avatar = avatar;
			this.owner = owner;
			this.members = new ArrayList<String>(Arrays.asList(members.split("[" + SEPERATUG + "]")));
			this.time = getTimestamp();
		}
	}

	/**
	 * Representation of chat item
	 *
	 * @author  P203125
	 */
	class Chat {

		String user;
		String channel;
		String text;
		String file;
		String time;
		int state;
		boolean broadcast;

		public Chat(String user, String channel, String text, String file, String time, int state, boolean broadcast) {
			this.user = user;
			this.channel = channel;
			this.text = text;
			this.file = file;
			this.time = time;
			this.state = state;
			this.broadcast = broadcast;
		}

		Chat(String line) {
			fromLine(line);
		}

		String toLine() {
			String ln =
				user
				+ SEPERATOR
				+ channel
				+ SEPERATOR
				+ text
				+ SEPERATOR
				+ file
				+ SEPERATOR
				+ state
				+ SEPERATOR
				+ time;
			return ln;
		}

		void fromLine(String line) {
			String[] s = line.split(Pattern.quote(SEPERATOR));
			if (s.length == 6) {
				user = s[0];
				channel = s[1];
				text = s[2];
				file = s[3];
				state = Integer.parseInt(s[4]);
				time = s[5];
			}
		}
	}

	/**
	 * Representation of chat request object
	 *
	 * @author  P203125
	 */
	class Request {
		WebSocket conn;
		String message;
		ByteBuffer buffer;
		LinkedTreeMap<String, String> json;
		int type;

		public Request(WebSocket conn, String message, ByteBuffer buffer) {
			this.conn = conn;
			this.message = message;
			this.buffer = buffer;
			if (message != null) {
				this.json = fromJSON(message);
				this.type = Integer.parseInt(get("type"));
			}
		}

		String get(String key) {
			return json.get(key);
		}

		void print() {
			if (conn != null) {
				String msg = message;
				if (buffer != null) {
					msg = "ByteBuffer was received.";
				} else if (REQUEST_TYPES.Open.isEqual(type)) {
					msg = "connected!";
				} else if (REQUEST_TYPES.Close.isEqual(type)) {
					msg = "disconnected!";
				} else {

					int n = msg.indexOf("password");
					if (n != -1) {
						msg = msg.substring(0, n + 10)
							+ "\"***\"}";
					}

					msg = "request: "
						+ REQUEST_TYPES.fromType(type).name()
						+ " message: "
						+ msg;
				}
				log.trace(getHostname(conn) + ": " + msg);
			}
		}
	}

	/**
	 * @author  nalizadeh.org
	 */
	class Response {

		ResponseContent content;
		Notify notify;

		public Response(RESPONSE_TYPES state, String result, Object data, Notify notify) {
			this.content = new ResponseContent(state.type, result, data);
			this.notify = notify;

		}

		void send(WebSocket conn) {
			if (content.data instanceof ByteBuffer) {
				conn.send((ByteBuffer) content.data);
			} else {
				conn.send(toJSON(content));
			}

			if (notify != null) {
				try {
					Thread.sleep(1000);
				} catch (InterruptedException ex) {

				}
				notify.doNotify();
			}
		}

		class ResponseContent {

			int type;
			String message;
			Object data;

			ResponseContent(int type, String result, Object data) {
				this.type = type;
				this.message = result;
				this.data = data;
			}
		}
	}

	/**
	 * @author  nalizadeh.org
	 */
	private static class RequestHandler implements Runnable {

		ChatServer famchat;
		Request request;

		public RequestHandler(ChatServer famchat, Request request) {
			this.famchat = famchat;
			this.request = request;
			new Thread(this).start();
		}

		@Override
		public void run() {
			int count = 0;
			while (isActive && count < 5) {
				try {
					Thread.sleep(1000);
				} catch (InterruptedException ex) {
				}
				log.trace("waiting...");
				count++;
			}
			isActive = false;
			famchat.handleRequest(request);
		}
	}

	/**
	 * @author  nalizadeh.org
	 */
	class Notify implements Runnable {

		ChatServer famchat;
		String username;
		Chat chat;
		RESPONSE_TYPES type;

		public Notify(ChatServer famchat, String username, Chat chat, RESPONSE_TYPES type) {
			this.famchat = famchat;
			this.username = username;
			this.chat = chat;
			this.type = type;
		}

		public void doNotify() {
			new Thread(this).start();
		}

		@Override
		public void run() {
			famchat.notifyChannels(username, chat, type);
		}
	}

	/**
	 * Password utility
	 *
	 * @author  nalizadeh.org
	 */
	private static class PasswordUtils {

		// Password: 123456
		// Salt: 79CMvuCQCjnPEucKtyMzpU19SwoHXU
		// Password: AnjTucwTd3aoAKwyAek2hWV7St1HawB2/xdjguT4axA=

		private static final Random RANDOM = new SecureRandom();
		private static final String ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
		private static final int ITERATIONS = 10000;
		private static final int KEY_LENGTH = 256;

		public static String getSalt(int length) {
			StringBuilder returnValue = new StringBuilder(length);

			for (int i = 0; i < length; i++) {
				returnValue.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
			}

			return new String(returnValue);
		}

		public static byte[] hash(char[] password, byte[] salt) {
			PBEKeySpec spec = new PBEKeySpec(password, salt, ITERATIONS, KEY_LENGTH);
			Arrays.fill(password, Character.MIN_VALUE);
			try {
				SecretKeyFactory skf = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA1");
				return skf.generateSecret(spec).getEncoded();
			} catch (NoSuchAlgorithmException | InvalidKeySpecException e) {
				throw new AssertionError("Error while hashing a password: " + e.getMessage(), e);
			} finally {
				spec.clearPassword();
			}
		}

		public static String generateSecurePassword(String password, String salt) {
			String returnValue = null;
			byte[] securePassword = hash(password.toCharArray(), salt.getBytes());
			returnValue = Base64.getEncoder().encodeToString(securePassword);
			return returnValue;
		}

		public static boolean verifyUserPassword(String providedPassword, String securedPassword, String salt) {
			boolean returnValue = false;
			String newSecurePassword = generateSecurePassword(providedPassword, salt);
			returnValue = newSecurePassword.equalsIgnoreCase(securedPassword);
			return returnValue;
		}

		@SuppressWarnings("unused")
		public static String generateTestPassword(String password) {
			String salt = getSalt(30);
			String pwd = PasswordUtils.generateSecurePassword(password, salt);
			return salt
			+ "/"
			+ pwd;
		}
	}

	//==========

	public static void main(String[] args) {

		try {
			new ChatServer();

		} catch (Exception e) {
			System.out.println("ChatServer Startup Error");
		}
	}
}
