BergEMS
=======

Website for membership management, scheduling, etc.

Development
-----------

* Clone the repo
* Install [Vagrant](https://www.vagrantup.com/)
* In the repo directory, run `vagrant up`. Vagrant will download the VM image
  (this'll take a while the first time).
* SSH to the VM (run `vagrant ssh`) and, in the VM, run the following:
  ````
  $ sudo su
  # cd /vagrant
  # node app.js
  ```
* In your browser, open [localhost:3000](http://localhost:3000).
* Log in with username `admin` and password `admin`.

Detailed setup for those less-familiar with software development
----------------------------------------------------------------

The first thing you will need is a git client. GitHub makes one that is pretty
friendly and free: [GitHub Desktop](https://desktop.github.com). Download and
install it. When you open it, you'll need to sign in to your GitHub account. You
should then be able to clone this repository (`benburwell/MCEMS-Site`). This
downloads all the code to your computer so you can edit it.

Before you make any changes, you should check out a new *branch*. This is a
place to make changes separate from the currently-running version of the code.

In the GitHub Desktop program, go to *Repository > Open in Terminal*. Make sure
you've installed [Vagrant](https://www.vagrantup.com), then type `vagrant up`
and press return. This will run for a while (it'll be quicker the next time).
Vagrant creates a virtual server that will run the code from your computer so
you can test out the changes you make.  When it's finished, you'll need to
access the virtual server to start the application. Type `vagrant ssh` and press
return. You should see a new prompt. Next, type `sudo su` and press return. The
prompt should now end with a `#` instead of a `$`. Next, type `cd /vagrant`,
then enter `node app.js`. After a moment, you should start seeing some log
messages in the terminal.

Now, go to `http://localhost:3000` and you should see the portal. This is not
the actual portal, this is running on your computer. Log in using the username
`admin` and password `admin`.

The next thing you will need is a good text editor. I recommend [Sublime
Text](https://www.sublimetext.com/) for getting started. Once you have it
installed, go back to GitHub Desktop and choose *Repository > Open in Sublime
Text* (you might have to close and reopen GitHub Dekstop for this option to
appear).

You'll see all the files that make up the site in the sidebar, and clicking on
any of them will allow you to edit it. To try this out, try going to
[http://localhost:3000/not-a-real-page](http://localhost:3000/not-a-real-page).
You should see a "Not Found" message. Now, open up `views/404.pug` and change
"Not Found" to your name and save. Now, when you reload the page, you should see
your name.

You can change any of the files in the `views` folder without restarting the
server, but if you need to change any of the other files, e.g. in the `routes`
folder, you'll need to restart the server. In Terminal, type Control-C to stop
the server. Then, simply type `node app.js` again to start it back up. As a
shortcut, you can press the up arrow key to get the last command you typed (then
just press return again). After you restart the sever, you'll need to log back
in again.

Once you're done with your changes, you'll need to commit them to your branch.
In GitHub Desktop, you'll see all the files and changes you've made. Select the
checkbox next to all the changes you want to commit, then enter a description of
what you did and press the *Commit to <your branch>* button. If the button says
*Commit to master*, make sure you've created a branch and have switched to it.
For more information about branches, see [this guide to the GitHub
Flow](https://guides.github.com/introduction/flow/).

Once you've tested your changes, it's time to deploy them. Press the *Publish
Branch* button in GitHub Desktop. Now go to *Branch > Create Pull Request*. This
will open the GitHub website. Write a brief description of what you did and why,
then add @benburwell as a reviewer and create the pull request.

