Vagrant.configure("2") do |config|

  # Use "trusty64" Ubuntu 14.04 box
  config.vm.box = "ubuntu/trusty64"

  # Our app server will run on port 3000, so mirror that to the host
  config.vm.network "forwarded_port", guest: 3000, host: 3000

  # On boot, we need to install some dependencies and such
  # More precisely:
  #   1. Install MongoDB
  #      - Import code signing key
  #      - Install the package
  #      - Start the server
  #   2. Install nvm
  #      - Install curl
  #      - Download the install script
  #      - Add nvm commands to our current shell
  #      - Use nvm to install an appropriate Node version
  #      - Finally, use that version
  #   3. Run our code
  #      - Change to the code directory
  #      - Install npm dependencies
  #      - Run the account bootstrap script to create an admin account
  #        in the database
  #      - Start the server
  config.vm.provision :shell, inline: <<-END
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10
    echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
    apt-get update
    apt-get install -y mongodb-org
    service mongod start
    apt-get install -y curl build-essential checkinstall libssl-dev
    curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.8/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install v8.9.3
    nvm use v8.9.3
    cd /vagrant
    npm install
    node bootstrap_accounts.js
  END
end

# vim: :set ft=ruby:
