FROM node:16

ENV NODE_PATH=/usr/local/lib/node_modules
RUN npm install -g @koush/wrtc avsc bip32 electron fatfs runtimejs sodium-native sodium-universal thrift typeforce ws
