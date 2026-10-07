import { useEffect, useState } from "react";

function Loading() {
  const [text, setText] = useState("L");

  useEffect(() => {
    const word = "Loading";
    let index = 1;
    let dots = 0;

    const interval = setInterval(() => {
      if (index <= word.length) {
        setText(word.slice(0, index));
        index++;
      } else {
        dots = (dots + 1) % 4;
        setText(word + ".".repeat(dots));
        
        if (dots === 0) {
          index = 1;
        }
      }
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-40 items-center justify-center rounded-xl bg-white shadow-md">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />

        <p className="w-24 text-center text-lg font-medium text-gray-600">
          {text}
        </p>
      </div>
    </div>
  );
}

export default Loading;
