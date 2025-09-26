# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/09/19 03:24:06 by rzhdanov          #+#    #+#              #
#    Updated: 2025/09/26 05:32:18 by rzhdanov         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM node:20-bullseye-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev || npm install --only=production
COPY . .
ENV NODE_ENV=production
CMD ["node", "server.js"]
