import { useState } from 'react';

interface Props {
  start?: number;
}

export default function Counter({ start = 0 }: Props) {
  const [count, setCount] = useState(start);
  return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
}
