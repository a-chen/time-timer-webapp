# time-timer [![starline](https://starlines.qoo.monster/assets/qoomon/time-timer-webapp)](https://github.com/qoomon/starlines)

### [demo](https://timer.andrewchen.website)

- Inspired by the physical [Time Timer](https://www.timetimer.com/)
- Built on code from [qoomon](https://github.com/qoomon/time-timer-webapp)

I've always been baffled by why timers rarely have the current time on them, so I added one  

Enjoy

## build and run
### docker compose instructions
```shell
# build and start the service
docker compose up --build
# open the app in your browser
xdg-open "http://localhost:8080"

# stop the service
docker compose down
```

## development setup

### git hooks
After cloning the repository, install the git hooks:

```shell
./hooks/setup.sh
```

This installs:
- **pre-commit**: Auto-increments version number in package.json
- **pre-push**: Runs Playwright tests before pushing (prevents pushing broken code)

### running tests
```shell
npm test
```

## version management
1. Edit `package.json` and update the `version` field:
   ```json
   {
     "version": "x.x.x"
   }
   ```
2. The version file (`app/version.js`) is auto-generated and should not be edited manually.
3. The version is automatically incremented on each commit via the pre-commit hook.
