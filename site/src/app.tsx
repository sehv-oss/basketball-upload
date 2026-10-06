import type { ReactElement } from 'react';

import { Credits } from './components/credits.tsx';
import { FileTypesExample } from './components/examples/file-types-example.tsx';
import { FormsExample } from './components/examples/forms-example.tsx';
import { ReactExample } from './components/examples/react-example.tsx';
import { ThemingExample } from './components/examples/theming-example.tsx';
import { UploadsExample } from './components/examples/uploads-example.tsx';
import { WebComponentExample } from './components/examples/web-component-example.tsx';
import { HeroDemo } from './components/hero-demo.tsx';
import { InstallTabs } from './components/install-tabs.tsx';
import { SiteHeader } from './components/site-header.tsx';
import { useSiteTheme } from './hooks/use-site-theme.ts';

const FEATURES = [
  'Web Component',
  'React 19',
  'Shadow DOM',
  'Cascade layers',
  'light-dark() themes',
  'Form-associated',
  'Keyboard shots',
  'Zero dependencies',
];

export function App(): ReactElement {
  const [theme, setTheme] = useSiteTheme();

  return (
    <>
      <SiteHeader theme={theme} onThemeChange={setTheme} />

      <main id="top">
        <section className="hero container" aria-labelledby="hero-title">
          <p className="pill">
            <span className="pill-dot" aria-hidden="true" />
            Built on web standards
          </p>
          <h1 id="hero-title">
            Drag and drop,
            <br />
            <span className="accent">or take the shot.</span>
          </h1>
          <p className="lead">
            A file upload where the dropzone is a backboard. Drop your files on
            it, or pull a file back like a slingshot and score it into the
            basket. A faithful implementation of{' '}
            <a href="#credits">Jorge Molina&apos;s design</a>.
          </p>
          <ul className="chips" aria-label="Features">
            {FEATURES.map((feature) => (
              <li key={feature}>{feature}</li>
            ))}
          </ul>

          <HeroDemo />
          <InstallTabs />
        </section>

        <div className="container sections">
          <WebComponentExample />
          <ReactExample theme={theme} />
          <ThemingExample />
          <FileTypesExample theme={theme} />
          <FormsExample theme={theme} />
          <UploadsExample />
          <Credits />
        </div>
      </main>

      <footer className="site-footer">
        <div className="container site-footer-inner">
          <span>
            ISC License — <a href="https://github.com/sehv-oss">sehv-oss</a>
          </span>
          <span>
            Design by{' '}
            <a href="https://www.figma.com/@jm_fuster">Jorge Molina</a> on Figma
            Community
          </span>
        </div>
      </footer>
    </>
  );
}
