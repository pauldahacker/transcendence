# **************************************************************************** #
#                                                                              #
#                                                         :::      ::::::::    #
#    Dockerfile                                         :+:      :+:    :+:    #
#                                                     +:+ +:+         +:+      #
#    By: rzhdanov <rzhdanov@student.42.fr>          +#+  +:+       +#+         #
#                                                 +#+#+#+#+#+   +#+            #
#    Created: 2025/09/19 03:24:06 by rzhdanov          #+#    #+#              #
#    Updated: 2025/09/19 03:27:30 by rzhdanov         ###   ########.fr        #
#                                                                              #
# **************************************************************************** #

FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY . .
CMD ["node", "server.js"]
