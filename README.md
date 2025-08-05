To run a Holster relay you can replace server/app.js with:

```
import Holster from "@mblaney/holster/src/holster.js"
Holster()
```

That's all you need to run a server on port `8765`. To run this with node:

 - `cd server`
 - `npm install`
 - `node app.js`

For production you can start with pm2:

 - `npm install pm2 -g`
 - `export NODE_ENV=production`
 - `pm2 startup` (And follow startup instructions.)
 - `pm2 start app.js`
 - `pm2 save`

To allow connections via Apache add the config:

```
<VirtualHost *:80>
  ServerName your-domain
  RewriteEngine On
  RewriteCond %{HTTPS} off
  RewriteRule (.*) https://%{HTTP_HOST}%{REQUEST_URI} [R=301,L]
</VirtualHost>

<VirtualHost *:443>
  ServerName your-domain
  SSLEngine On
  SSLCertificateFile /etc/letsencrypt/live/your-domain/cert.pem
  SSLCertificateKeyFile /etc/letsencrypt/live/your-domain/privkey.pem
  SSLCACertificateFile /etc/letsencrypt/live/your-domain/fullchain.pem
  RewriteEngine On
  RewriteCond %{HTTP:Upgrade} =websocket [NC]
  RewriteRule /(.*)           ws://localhost:8765/$1 [P,L]
  RewriteCond %{HTTP:Upgrade} !=websocket [NC]
  RewriteRule /(.*)           http://localhost:3000/$1 [P,L]
  ProxyPass / http://localhost:3000/
  ProxyPassReverse / http://localhost:3000/
</VirtualHost>
```

Use `certbot` to generate a certificate.

The second set of rules (from `RewriteCond`) can be removed if you're not
listening on a second port (3000 in this case).

If someone wants to share their NGINX config I will add it to this README.
