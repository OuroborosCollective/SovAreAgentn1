sed -i 's/USER node/RUN addgroup -g 10000 nplus1 \&\& adduser -D -u 10000 -G nplus1 nplus1\nRUN chown -R nplus1:nplus1 \/app \/tmp\nUSER nplus1/g' Dockerfile
sed -i 's/chown -R node:node/chown -R nplus1:nplus1/g' Dockerfile
