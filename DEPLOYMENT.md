# VPS Deployment Setup Guide

This guide explains how to set up automated deployment to your VPS using GitHub Actions.

## Prerequisites

- A VPS with Docker and Docker Compose installed
- SSH access to your VPS
- GitHub repository with the code

## 1. VPS Setup

### Install Docker and Docker Compose on your VPS:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again to apply group changes
```

### Clone your repository on VPS:

```bash
# Navigate to your desired directory
cd /home/your-username

# Clone your repository
git clone https://github.com/your-username/slicefloFrontendStructure.git

# Navigate to project directory
cd slicefloFrontendStructure
```

## 2. SSH Key Setup

### Generate SSH Key Pair (if you don't have one):

```bash
# Generate new SSH key
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# This will create:
# ~/.ssh/id_rsa (private key - keep this secret!)
# ~/.ssh/id_rsa.pub (public key - add this to VPS)
```

### Add Public Key to VPS:

```bash
# Copy public key to VPS
ssh-copy-id username@your-vps-ip

# Or manually add to authorized_keys
cat ~/.ssh/id_rsa.pub | ssh username@your-vps-ip "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys"
```

### Test SSH Connection:

```bash
ssh username@your-vps-ip
```

## 3. GitHub Secrets Configuration

Go to your GitHub repository → Settings → Secrets and variables → Actions

Add the following secrets:

### Required Secrets:

1. **VPS_HOST**
   - Value: Your VPS IP address or domain name
   - Example: `192.168.1.100` or `your-domain.com`

2. **VPS_USERNAME**
   - Value: SSH username for your VPS
   - Example: `ubuntu`, `root`, or your custom username

3. **VPS_SSH_KEY**
   - Value: Your private SSH key content
   - Copy the entire content of `~/.ssh/id_rsa` file
   - Include the `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----` lines

4. **VPS_PROJECT_PATH**
   - Value: Full path to your project directory on VPS
   - Example: `/home/ubuntu/slicefloFrontendStructure`

### Optional Secrets:

5. **VPS_PORT**
   - Value: SSH port (if not using default 22)
   - Example: `2222`

## 4. How to Add GitHub Secrets

1. Go to your GitHub repository
2. Click on **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Add each secret with the exact names listed above
6. Click **Add secret**

## 5. Workflow Triggers

The deployment will automatically trigger when:
- You push to `main` or `staging` branches
- You manually trigger it from GitHub Actions tab

## 6. Deployment Process

The workflow will:
1. Checkout your code
2. Connect to VPS via SSH
3. Navigate to project directory
4. Pull latest changes
5. Stop existing containers
6. Clean up unused Docker resources
7. Build and start new containers
8. Perform health check
9. Show container status

## 7. Monitoring Deployments

- Go to your GitHub repository → **Actions** tab
- Click on any workflow run to see detailed logs
- Check the deployment status and any error messages

## 8. Troubleshooting

### Common Issues:

1. **SSH Connection Failed**
   - Verify VPS_HOST and VPS_USERNAME are correct
   - Check if VPS_SSH_KEY is properly formatted
   - Ensure SSH service is running on VPS

2. **Permission Denied**
   - Make sure your user has Docker permissions
   - Check if the project path exists and is accessible

3. **Docker Build Failed**
   - Check Dockerfile syntax
   - Ensure all dependencies are available
   - Review build logs in GitHub Actions

4. **Application Not Starting**
   - Check application logs: `docker compose logs`
   - Verify port 5000 is not already in use
   - Check if all environment variables are set

### Useful Commands for VPS:

```bash
# Check running containers
docker compose ps

# View application logs
docker compose logs -f

# Check Docker system status
docker system df

# Clean up unused resources
docker system prune -f

# Restart application manually
docker compose down && docker compose up -d --build
```

## 9. Security Best Practices

1. **Use a dedicated deployment user** instead of root
2. **Restrict SSH access** to specific IPs if possible
3. **Use SSH keys** instead of passwords
4. **Regularly update** your VPS and Docker
5. **Monitor logs** for any suspicious activity
6. **Backup your data** regularly

## 10. Environment Variables

If you need to set environment variables for your application, you can:

1. Add them to your `docker-compose.yml` file
2. Create a `.env` file on your VPS
3. Use GitHub secrets and pass them through the workflow

Example for docker-compose.yml:
```yaml
environment:
  - NODE_ENV=production
  - DATABASE_URL=your-database-url
  - API_KEY=your-api-key
```

## Support

If you encounter any issues:
1. Check the GitHub Actions logs
2. Review the troubleshooting section above
3. Check your VPS logs and Docker status
4. Ensure all secrets are correctly configured
