import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="es">
      <Head>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDJZDl0JEFrM1IjJgczZ8mPY8L8L5jZZjA&libraries=places"></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
