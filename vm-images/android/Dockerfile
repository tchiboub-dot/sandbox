FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    openjdk-11-jdk \
    wget \
    unzip \
    libgl1-mesa-dev \
    libpulse0 \
    libxcomposite1 \
    libxcursor1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libpango-1.0-0 \
    libgtk-3-0 \
    qemu-kvm \
    libvirt-daemon-system \
    libvirt-clients \
    bridge-utils \
    xvfb \
    x11vnc \
    fluxbox \
    ffmpeg \
    adb \
    curl \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# Set Android SDK environment
ENV ANDROID_SDK_ROOT=/opt/android-sdk
ENV ANDROID_AVD_HOME=/root/.android/avd
ENV PATH=$PATH:$ANDROID_SDK_ROOT/emulator:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/cmdline-tools/latest/bin

# Create directories
RUN mkdir -p $ANDROID_SDK_ROOT $ANDROID_AVD_HOME

# Download and install Android SDK command-line tools
RUN wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O /tmp/tools.zip && \
    unzip -q /tmp/tools.zip -d $ANDROID_SDK_ROOT && \
    rm /tmp/tools.zip && \
    mkdir -p $ANDROID_SDK_ROOT/cmdline-tools/latest && \
    mv $ANDROID_SDK_ROOT/cmdline-tools/bin $ANDROID_SDK_ROOT/cmdline-tools/latest/ && \
    mv $ANDROID_SDK_ROOT/cmdline-tools/lib $ANDROID_SDK_ROOT/cmdline-tools/latest/

# Accept licenses
RUN yes | sdkmanager --licenses

# Install Android SDK packages
RUN sdkmanager "emulator" "platform-tools" "platforms;android-33" \
    "system-images;android-33;google_apis;x86_64" \
    "system-images;android-32;google_apis;x86_64" \
    "system-images;android-31;google_apis;x86_64" \
    "system-images;android-30;google_apis;x86_64"

# Install Node.js
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs && \
    npm install -g npm@latest

# Setup X11 virtual display
ENV DISPLAY=:99

# Copy emulator management service
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --production

COPY . .

# Expose ports
# 8080: API server
# 5554-5584: ADB ports (15 emulators max)
# 5004: WebRTC streaming
EXPOSE 8080 5554-5584 5004

# Setup supervisor to manage processes
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Start services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
