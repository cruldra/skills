---
name: jenkins-cli
description: 指导如何通过 Jenkins CLI 与 Jenkins 服务器进行交互。
---

# jenkins-cli

指导如何通过 Jenkins CLI 与 Jenkins 服务器进行交互。

## When to use

- 当需要通过命令行管理 Jenkins 服务器时。
- 当需要自动化 Jenkins 任务时。
- 当需要远程执行 Jenkins 命令时。

## Instructions

1. 先运行`jks help`命令来查看可用的 Jenkins CLI 命令列表。
2. 如果`jks`命令不可用，先从`https://jenkins.ailoveworld.cn/jnlpJars/jenkins-cli.jar`(或者用户另行指定的地址)下载 Jenkins CLI 工具。
3. 向用户询问jenkins-cli.jar文件的存放路径，并将下载的`jenkins-cli.jar`文件放在该路径下。默认放到`~/Applications/jenkins-cli/jenkins-cli.jar`
4. 从环境变量中读取`JENKINS_USERNAME`和`JENKINS_API_TOKEN`，如果没有找到，则提示用户输入 Jenkins 的用户名和 API Token
3. 在用户目录下的`.zshrc`或者`.bashrc`(取决于当前使用的 shell)文件中添加`jks`别名,比如

```bash
alias jks='java -jar /home/cruldra/Applications/jenkins-cli/jenkins-cli.jar -s https://jenkins.ailoveworld.cn/ -auth cruldra:1134e00c853945dc9749af3dd439142606 '
```
4. 重新加载 shell 配置文件并再次运行`jks help`命令来验证 Jenkins CLI 是否配置成功。