package Assignment_1;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.net.Socket;

public class ClientHandler extends Thread {

    private Socket socket;
    private MemoryUnit memoryUnit;

    public ClientHandler(Socket socket, MemoryUnit memoryUnit) {
        this.socket = socket;
        this.memoryUnit = memoryUnit;
    }

    @Override
    public void run() {
        try {
            DataInputStream in = new DataInputStream(socket.getInputStream());
            DataOutputStream out = new DataOutputStream(socket.getOutputStream());

            // Read exactly ONE request
            String request = in.readUTF();
            System.out.println("Received: " + request);

            String[] parts = request.trim().split("\\s+");
            String command = parts[0].toUpperCase();

            switch (command) {

                case "INIT": {
                    int usercode = memoryUnit.init();
                    out.writeUTF("USERCODE " + usercode);
                    break;
                }

                case "PUT": {
                    int usercode = Integer.parseInt(parts[1]);
                    boolean ok = memoryUnit.put(
                        usercode,
                        parts[2], // name
                        parts[3], // city
                        parts[4]  // country
                    );
                    out.writeUTF(ok ? "OK" : "FAILED");
                    break;
                }

                case "GET": {
                    int usercode = Integer.parseInt(parts[1]);
                    String field = parts[2].toLowerCase();
                    String value = memoryUnit.get(usercode, field);
                    out.writeUTF(value == null ? "" : value);
                    break;
                }

                case "DELETE": {
                    int usercode = Integer.parseInt(parts[1]);
                    boolean deleted = memoryUnit.delete(usercode);
                    out.writeUTF(deleted ? "DELETED" : "NOT_FOUND");
                    break;
                }

                case "GETALL": {
                    var list = memoryUnit.getAll(parts[1]);
                    if (list == null) {
                        out.writeUTF("AUTH_FAILED");
                    } else {
                        for (String s : list) out.writeUTF(s);
                        out.writeUTF("END");
                    }
                    break;
                }

                default:
                    out.writeUTF("UNKNOWN_COMMAND");
            }

            socket.close();

        } catch (IOException e) {
            System.out.println("Client error: " + e.getMessage());
        }
    }
}
