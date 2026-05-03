import { createHashRouter } from 'react-router-dom';
import Home from './screens/Home';
import Editor from './screens/Editor';

export const router = createHashRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/editor',
    element: <Editor />,
  },
]);
