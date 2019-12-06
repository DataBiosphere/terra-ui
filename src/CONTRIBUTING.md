# Libraries and Technologies
## React
What is React?
React is a Javascript library for building user interfaces. 

Why do we use React?
React has simple and elegant API's that allow us to easily componentize pieces of our application without prescribing how applications should be written.
  
[React](https://reactjs.org/docs/getting-started.html)
## react-hyperscript-helpers
[react-hyperscript-helpers](https://github.com/Jador/react-hyperscript-helpers)
## Lodash/fp
### Helpful Links
[Lodash/fp API's](https://gist.github.com/jfmengels/6b973b69c491375117dc)
# Philosophy
* Write simple, easy to understand code
  * Can others easily understand your code today?
  * Can you easily explain your code?
  * In a year from now will you still understand this code?
  * Simple code alleviates the need for comments which can easily become stale
* Prefer functional coding
  * Functional code that is side-effect free or has predictable effects is easier to reason about
  * Easier to test
  * Easier to understand
* Don't be afraid to upset the status quo
  * While accepted or industry standard approaches have value and get us close to where we want to be, rethinking problems from first principles can spur innovation and deliver better results
  * Industry standard approches will solve for a general problem, but if we think of a solution to our specific problem it can yield a better solution
* Always ask why / what is the problem we are addressing?
  * Just because we can, does that mean we should?
  * Are we solving an issue for the user, or completing a task?
* Release Often
  * Release small iterable chunks of functionality with low risk 
  * Makes it easier to find and fix issues when they arise
* Handling feedback
  * Iterate on the code until it is at a high level of craftsmanship before merging
  * Quality over speed
* Finding the right abstractions
  * Is what you are writing generally useful?
  * Is it imperative code? 
  * Could it be factored out to something more generally
    * Write hooks, wrappers ("with" handlers), HoC's
  * Strive more towards being development minded
* If something is hard to understand or see something that can be done better, do it!
  * This keeps tech debt down, the code base simple, easy to understand and work with
* Keep the development environment simple and easy to use, providing clear error messages
* 
# Stylistic Aspects (how we maintain our philosophy)
* Avoid using let (never use var) prefer using const instead 
  * Using let introduces additional state and potentially side effects into a function. This can make it diffcult to reason about the code and potentially introduce bugs
# Guiding Principles 
# Deployment Cycle (Other Tips)