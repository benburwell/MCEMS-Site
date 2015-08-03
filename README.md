BergEMS
=======

Website for membership management, scheduling, etc.

Development
-----------

* Clone the repo
* Install [Vagrant](https://www.vagrantup.com/)
* Install [VirtualBox](https://www.virtualbox.org/)
* In the repo directory, run `vagrant up`. Vagrant will download the VM image (this'll take a while the first time).
* SSH to the VM (run `vagrant ssh`) and, in the VM, run the following: `cd /vagrant; node app.js`
* In your browser, open [localhost:3000](http://localhost:3000). You'll get an error from NewRelic about not running because of no license key, but that's fine. We don't want to be collecting data from dev anyway.
* Log in with username `admin` and password `admin`.
