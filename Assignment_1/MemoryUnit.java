package Assignment_1;


import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

public class MemoryUnit {

    private final Map<Integer, List<String>> store = new ConcurrentHashMap<>();
    private final AtomicInteger counter = new AtomicInteger(1);
    private final String SECRET_CODE = "s3cr3t";

    public int init() {
        int usercode = counter.getAndIncrement();
        store.put(usercode, new ArrayList<>(Arrays.asList("", "", "")));
        return usercode;
    }

    public boolean put(int usercode, String name, String city, String country) {
        List<String> data = store.get(usercode);
        if (data == null) return false;

        data.set(0, name);
        data.set(1, city);
        data.set(2, country);
        return true;
    }

    public String get(int usercode, String field) {
        List<String> data = store.get(usercode);
        if (data == null) return null;

        switch (field) {
            case "name": return data.get(0);
            case "city": return data.get(1);
            case "country": return data.get(2);
            default: return null;
        }
    }

    public boolean delete(int usercode) {
        return store.remove(usercode) != null;
    }

    public List<String> getAll(String code) {
        if (!SECRET_CODE.equals(code)) return null;

        List<String> result = new ArrayList<>();
        for (var e : store.entrySet()) {
            List<String> d = e.getValue();
            result.add(
                "Usercode: " + e.getKey() +
                ", Name: " + d.get(0) +
                ", City: " + d.get(1) +
                ", Country: " + d.get(2)
            );
        }
        return result;
    }
}
