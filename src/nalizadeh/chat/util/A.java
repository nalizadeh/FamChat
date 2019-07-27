/*--- (C) 1999-2019 Techniker Krankenkasse ---*/

package nalizadeh.chat.util;

public class A {

	private String name;
	private A next;

	public A(String name, A next) {
		this.name = name;
		this.next = next;
	}

	private String getString(A a, int index) {
		if (a != null) {
			return index + ": " + a.name + "\n" + getString(a.next, index + 1);
		}
		return "";
	}

	@Override
	public String toString() {
		int index = 1;
		return index + ": " + name + "\n" + (next != null ? getString(next, index + 1) : "");
	}

	public static void main(String[] args) {

		A a = new A("Name-1", new A("Name-2", new A("Name-3", new A("Name-4", null))));

		System.out.println(a.toString());
	}
}

/*--- Formatiert nach TK Code Konventionen vom 05.03.2002 ---*/
