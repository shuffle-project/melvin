FROM ubuntu:20.04

# update repositories and install dependencies
RUN apt-get update && apt-get install curl wget zsh git nano -y

# oh-my-zsh
RUN sh -c "$(curl https://raw.githubusercontent.com/robbyrussell/oh-my-zsh/master/tools/install.sh)" --unattended

# node 16
RUN curl -sL https://deb.nodesource.com/setup_16.x | bash -
RUN apt install nodejs

# nestjs cli
RUN npm i -g @nestjs/cli

# use zsh bash
CMD ["zsh"]