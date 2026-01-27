package Assignment_1;

import java.io.DataInputStream;
import java.io.DataOutputStream;
import java.net.Socket;
// import java.net.InetSocketAddress;

public class Client {

    public static void main(String[] args) {

        if (args.length < 3) {
            System.out.println("Usage: java Client <ip> <port> <command>");
            return;
        }

        String ip = args[0];
        int port = Integer.parseInt(args[1]);

        try {
            Socket socket = new Socket();
            socket.connect(new java.net.InetSocketAddress(ip, port), 5000); // 5 second timeout
            DataOutputStream out = new DataOutputStream(socket.getOutputStream());
            DataInputStream in = new DataInputStream(socket.getInputStream());

            // Build ONE command
            StringBuilder cmd = new StringBuilder();
            for (int i = 2; i < args.length; i++) {
                cmd.append(args[i]).append(" ");
            }

            out.writeUTF(cmd.toString().trim());

            // Read response(s)
            while (true) {
                String response = in.readUTF();
                if (response.equals("END"))
                    break;
                System.out.println(response);
                if (in.available() == 0)
                    break;
            }

            socket.close();

        } catch (Exception e) {
            System.out.println("Client error: " + e.getMessage());
        }
    }
}
