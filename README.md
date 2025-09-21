# Bear-Us-One-More-Time-Capstone-Project

## How start the database
This will be a temporary way to run the database. This is a way for members of the team to create a Docker image of a 
MySQL database and experiment with pages on the backend they are currently working on. The current steps to get started are:

1. First to start the docker engine this can be done either through the Docker Desktop app or through your CLI depending on which version you went with.

2. Next you need to create your image using the ./docker/database.yml file.
 - You can use the docker compose -f docker/database.yml up -d to build and start the image. This must be done in the main project folder or remove the docker/ and run it in the docker directory.

3. At this point you will need to run the dbCreateSchema.js to create our schema for the project.
    - First change your current directory to the api-backend folder
    - Second you will run the npm install mysql2
    - Third you will run the "node dbCreateSchema.js" command
    - This should return "Schema applied!" in the console on success
4. If this is your first time setting up the Database you should test to see if the schema is created successfully by "node dbConnect.js" This will print your databases and what tables are in each one.

5. To cease the image you can kill it in your Docker Desktop app or run the "docker compose -f docker/database.yml down" command.
To clear the data from the database, use: docker compose -f docker/local.docker-compose.yml down -v.

The next steps for this part of the app is to create an api-backend docker compose and more nodes to interact with the database.
