# Changelog

## 0.5.0

Add sub commands.

They current mix with the arguments for users

```
node.js sc.js --arg1 before cmd1 --arg2 after
{
  arg1: "before",
  cmd1: {
    arg2: "after",
  }
}
```
