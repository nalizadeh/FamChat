package org.slf4j;

import java.util.HashMap;
import java.util.Map;

/**
 * @author nalizadeh.org
 */
public class LoggerFactory {
	
	private static Map<String, Logger> loggers = new HashMap<String, Logger>();

	public static Logger createLogger(String id) {
		if (!loggers.containsKey(id)) {
			loggers.put(id, new Logger(id));
		}
		return loggers.get(id);
	}

	public static Logger getLogger(String id) {
		return loggers.get(id);
	}

	public static Logger getLogger(Class<?> glass) {
		return loggers.get("WebSocket");
	}
}
