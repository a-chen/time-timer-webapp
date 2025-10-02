# time-timer-webapp [![starline](https://starlines.qoo.monster/assets/qoomon/time-timer-webapp)](https://github.com/qoomon/starlines)

[![Build & Deploy](https://github.com/qoomon/time-timer-webapp/workflows/Build%20&%20Deploy/badge.svg)](https://github.com/qoomon/time-timer-webapp/actions)

### [Demo](https://qoomon.github.io/time-timer-webapp?init=600)

### Screenshot
[![screenshot](docs/Screenshot.png)](https://qoomon.github.io/time-timer-webapp?init=600)

### Docker Compose Instructions
```shell
# build and start the service
docker compose up --build
# open the app in your browser
xdg-open "http://localhost:8080"

# stop the service
docker-compose down
```

### Version Management

The app displays version information in the bottom-left corner: `v1.0.1 (764b8b5)`

- **Semver version** (e.g., `1.0.1`) comes from `package.json`
- **Git commit SHA** (e.g., `764b8b5`) is auto-generated during build

#### How to Update Version

1. Edit `package.json` and update the `version` field:
   ```json
   {
     "version": "1.0.2"
   }
   ```

2. Follow semantic versioning:
   - **MAJOR** (x.0.0): Breaking changes
   - **MINOR** (1.x.0): New features, backward compatible
   - **PATCH** (1.0.x): Bug fixes

3. Build the project - version info is auto-generated:
   ```shell
   npm run build
   ```

The version file (`app/version.js`) is auto-generated and should not be edited manually.
