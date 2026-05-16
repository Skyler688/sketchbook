export function createBridge(initialValue) {
    let data = initialValue;
    const listeners = new Set();

    return {
        // Extracting data
        get() {
            return data;
        },

        // Updating data
        mutate(mutator) {
            mutator(data);
            listeners.forEach((listener) => listener(data));
        },

        // Event listener (MUST BE USED INSIDE "useEffect")
        listen(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener); // Returning the delete, this is put in a variable then executed later like this-> variable_name();
        },
    };
}
