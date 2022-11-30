# evolvus-platform-server

## To build the image
```
sudo docker build -t hobbs.evolvus.com:11083/sandstorm-platform-service .
```

## To deploy the image to nexus
```
docker image push hobbs.evolvus.com:11083/sandstorm-platform-service:latest
```

## To start the docker image
```
export TZ=Asia/Kolkata
export MONGO_DB_URL=mongodb://UserAdmin:12356789@10.24.62.134:27017/testdb?poolSize=100&authSource=admin
export DEBUG=evolvus*
export SWE_URL=http://10.24.62.135:8088/api/swe
export CORPORATE_URL=http://10.24.201.57:8080/flux-services/corporate/status/
export SCRIPT_HOME=/backup/cdanach/cda_home/application-property-files/mongoseed/
export DB_PORT=27017
export DB_HOST=10.24.62.134
export DB_NAME=testdb
export SERVICE_IP=10.24.62.135
export SERVICE_PORT=8086
export DOCKET_POST_URL=http://10.24.62.135:8085/api/audit
export SCRIPT_PATH=/backup/cdanach/cda_home/application-property-files/seeddata/

docker run -d --rm --name sandstorm-platform-service -e TZ -e MONGO_DB_URL -e DEBUG -e SWE_URL -e CORPORATE_URL -e SCRIPT_HOME -e DB_PORT -e DB_HOST -e DB_NAME -e SERVICE_IP -e SERVICE_PORT -e DOCKET_POST -e SCRIPT_PATH -p 8086:8086 -v /backup/cdanach/cda_home/application-property-files/mongoseed/:/backup/cdanach/cda_home/application-property-files/mongoseed/ -v /backup/cdanach/cda_home/application-property-files/seeddata/:/backup/cdanach/cda_home/application-property-files/seeddata/ 182.72.155.166:10515/sandstorm-platform-service:latest
```
