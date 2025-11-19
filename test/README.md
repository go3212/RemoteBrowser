# Session Import Test

To test session import, you need a zipped Chrome profile.

1.  **Create a profile:**
    Run a local Chrome/Chromium, do some stuff (login, save cookies).
    Locate the User Data Directory.
    Zip the contents of the Default (or specific profile) folder.

2.  **Import via API:**
    ```bash
    curl -X POST -F "file=@/path/to/profile.zip" http://localhost:3000/sessions/import
    ```
    This returns a session object with `sessionBlobId`.

3.  **Start Session:**
    ```bash
    curl -X POST http://localhost:3000/sessions/<SESSION_ID>/start
    ```
    The worker will start with the restored profile.

**Note:** Browserless/Chrome usually expects the user data dir to be structured in a specific way. The orchestrator mounts the extracted zip to `/session-profile` and sets `USER_DATA_DIR=/session-profile`.

