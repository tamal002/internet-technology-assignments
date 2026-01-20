package Assignment_1;


import java.io.IOException;
import java.net.ServerSocket;
import java.net.Socket;

public class Server {

    private ServerSocket ss;
    private MemoryUnit memoryUnit = new MemoryUnit();

    public Server(int port) {
        try {
            ss = new ServerSocket(port);
            System.out.println("Server started on port " + port);

            while (true) {
                Socket s = ss.accept();
                System.out.println(
                    "Client connected: " +
                    s.getInetAddress().getHostAddress() + ":" + s.getPort()
                );

                new ClientHandler(s, memoryUnit).start();
            }

        } catch (IOException e) {
            System.out.println("Server error: " + e.getMessage());
        }
    }

    public static void main(String[] args) {
        int port = args.length > 0 ? Integer.parseInt(args[0]) : 8080;
        new Server(port);
    }
}
