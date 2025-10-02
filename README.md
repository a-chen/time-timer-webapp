# time-timer-webapp [![starline](https://starlines.qoo.monster/assets/qoomon/time-timer-webapp)](https://github.com/qoomon/starlines)

[![Build & Deploy](https://github.com/qoomon/time-timer-webapp/workflows/Build%20&%20Deploy/badge.svg)](https://github.com/qoomon/time-timer-webapp/actions)

### [Demo](https://qoomon.github.io/time-timer-webapp)

### Screenshot
[![screenshot](docs/Screenshot.png)](https://qoomon.github.io/time-timer-webapp?init=600)

### Docker Compose Instructions
```shell
# build and start the service
docker compose up --build
# open the app in your browser
xdg-open "http://localhost:8080"

# stop the service
docker compose down
```

### Version Management

1. Edit `package.json` and update the `version` field:
   ```json
   {
     "version": "1.0.2"
   }
   ```
2. The version file (`app/version.js`) is auto-generated and should not be edited manually.
