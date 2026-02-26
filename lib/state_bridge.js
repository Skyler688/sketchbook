// IMPORTANT NOTE -> This "state_bridge" was created to solve possible poor performance when using the canvas with useState.
// Rerendering the HTML canvas element requires that all the previusaly rendered lines be redrawn again. I needed a way to
// manually control shared "state" across components without triggering a rerender.

// NOTE -> I used AI (chatgpt) to help come up with this, i had it help me explore possible solutions, and after some time landed on this.
// It provides a component API layer that allows for a shared and global state with methods to get, update, listen
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
