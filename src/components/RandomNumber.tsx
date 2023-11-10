import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";

function RandomNumber() {
  // this is reacts state management. 
  // number should be treated as immutable
  // setNumber can be used to change number, 
  // on change the component is rerendered
  // The state itself is only created the first time the 
  // Component is rendered (thats why it is not called createState)
  // The argument '0' is just to identifiy the state if we 
  // would have multiple state variables why would seperate them by
  // the argument.
  // the argument can have any type. useState("foo") would also be fine.
  // but zero is just a convention for simple components
  let [number, setNumber] = useState(0);

  // React components are pure functions.
  // useEffects allows us to implement side effects
  // useEffects are run after react has rendered the DOM.
  // here we are using it to listen to events.
  useEffect(() => {
    // the generic argument of listen is the type of the payload.
    let unsubscribe = listen<number>("random-integer", (event) => {
      console.log("random-integer event");
      let number = event.payload;
      // by calling set number we tell react to update the DOM.
      setNumber(number);
      // compared to just calling number = 10; this would just update the variable 
      // but not tell react to actually update.
    });
    // the lambda returned will be executed on cleanup of the effect.
    return () => {
       // unsubscribe from listeners
       unsubscribe.then(f => f());
    };
  });

  return <p>{number}</p>
}

export default RandomNumber;

