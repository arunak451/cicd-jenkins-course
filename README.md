# Malli Akka CI/CD + Jenkins Class 🚀

A CI/CD course for DevOps beginners. Malli Akka, an animated teacher avatar, explains CI/CD, Jenkins and GitHub Actions in Tanglish with kid-style analogies and Tamil voice narration, in the same format as the [Kubernetes](https://kubernets.vercel.app) and [Terraform + Ansible](https://terraform-ansible-course.vercel.app) courses.

- **3 CI/CD basics lessons:** CI vs delivery vs deployment, pipeline stages & artifacts, deployment strategies & rollback
- **13 Jenkins lessons:** install, freestyle & triggers, Jenkinsfile, GitHub webhook & multibranch, credentials & parameters, agents, parallel/when/input, test reports & artifacts, SonarQube & Trivy, Docker build & ECR push, Kubernetes/EC2 deploy, shared libraries, admin (security, backup, JCasC)
- **GitHub Actions** for Jenkins users, plus a **full pipeline project** (webhook ➜ tests ➜ Sonar gate ➜ Trivy ➜ ECR ➜ Helm ➜ prod approval)
- **6 interview lessons:** Jenkins vs Actions vs GitLab, debugging failed pipelines, secrets, declarative vs scripted, speeding up pipelines, common questions
- Each lesson: 8 scenes; the board shows big text, lists, a fake terminal and Jenkinsfile/YAML explained line by line
- Practice terminal (4 tasks per lesson), 5-question quiz, searchable cheat sheet, 15-step project guide, 24-question mock interview
- Progress is saved in localStorage; the layout works on mobile

## Layout

```
public/            ← the only folder Vercel serves (vercel.json → outputDirectory)
  index.html       player, practice, quiz, cheat sheet, project guide, mock interview
  lessons.js       18 core lessons  [subtitle, board]
  extras.js        interview lessons, practice tasks, quizzes
  project.js       project guide steps
  mock.js          mock interview questions
  durations.js     lesson lengths (generated)
  audio/           {lesson}-{scene}.mp3, mq-N.mp3, fx-*.mp3 (generated)
tools/             NOT deployed
  ta.mjs           Tanglish subtitle ➜ Tamil-script narration
  gen-audio.mjs    TTS: Sarvam (bulbul:v3, kavitha) or TTS=fish (Fish Audio free model)
  durations.mjs    measures audio ➜ public/durations.js
  check.mjs        validates lessons / practice regexes / quizzes
.env               SARVAM_API_KEY / FISH_API_KEY  (git-ignored, never deployed)
```

## Regenerating audio

```bash
cp .env.example .env    # add your key
node tools/gen-audio.mjs --print 6                 # preview the Tamil narration of lesson 6
TTS=fish node tools/gen-audio.mjs --only 6-3 --force
TTS=fish node tools/gen-audio.mjs --all
node tools/durations.mjs
node tools/check.mjs
```

## Deploy

Import this repo in Vercel (no build step; `vercel.json` serves `public/`).
