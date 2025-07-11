FROM jenkins/jenkins:lts

USER root

# Install required packages
RUN apt-get update && \
    apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common \
    wget \
    unzip

# Install Docker CLI using a more reliable method
RUN install -m 0755 -d /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg -o /tmp/docker.gpg && \
    gpg --dearmor -o /etc/apt/keyrings/docker.gpg /tmp/docker.gpg && \
    chmod a+r /etc/apt/keyrings/docker.gpg && \
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
    tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# Create docker group (fix for usermod error)
RUN groupadd -f docker

# Set up Jenkins permissions to access Docker
RUN usermod -aG docker jenkins

# Create initialization script to handle docker permissions at startup
RUN echo '#!/bin/bash\n\
# Fix docker socket permissions\n\
if [ -S /var/run/docker.sock ]; then\n\
    chown root:docker /var/run/docker.sock\n\
    chmod 660 /var/run/docker.sock\n\
fi\n\
\n\
# Switch to jenkins user and start jenkins\n\
exec su jenkins -s /bin/bash -c "/usr/local/bin/jenkins.sh"\n\
' > /usr/local/bin/jenkins-docker-init.sh && \
    chmod +x /usr/local/bin/jenkins-docker-init.sh

# Install Docker Compose
RUN curl -L "https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# Install Java 17 (required for Spring Boot 3.x)
RUN apt-get install -y openjdk-17-jdk

# Install Maven for Spring Boot builds
RUN apt-get install -y maven

# Install Node.js 20 (LTS) for Angular
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# Install Angular CLI globally
RUN npm install -g @angular/cli@latest

# Install additional tools for frontend builds
RUN npm install -g npm@latest

# Install Git
RUN apt-get install -y git



# Install additional utilities for CI/CD
RUN apt-get install -y \
    jq \
    zip \
    unzip \
    rsync

# Clean up
RUN apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Jenkins plugins using plugins.txt approach for better control
COPY plugins.txt /usr/share/jenkins/ref/plugins.txt
RUN jenkins-plugin-cli -f /usr/share/jenkins/ref/plugins.txt

# Set JAVA_HOME for Maven and other tools
ENV JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
ENV MAVEN_HOME=/usr/share/maven
ENV PATH=$PATH:$JAVA_HOME/bin:$MAVEN_HOME/bin

USER jenkins

# Set up workspace directory
WORKDIR /var/jenkins_home
