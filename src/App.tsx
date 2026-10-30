import { useRoute } from './lib/router';
import { Home } from './pages/Home';
import { Trace } from './pages/Trace';

export function App() {
  const route = useRoute();
  switch (route.name) {
    case 'trace':
      return <Trace target={route.target} />;
    case 'home':
      return <Home form={route.form} />;
  }
}
