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
  * Functional decomposition
* Prefer functional coding
  * Functional code that is side-effect free or has predictable effects is easier to reason about
  * Easier to test
  * Easier to understand
  * Using lodash
  * Keeping data concerns separate from the application
  * Using wrappers (e.g. withErrorHandling)
  * Making composable components and functions
  * Using currying where applicable
* Don't be afraid to upset the status quo
  * While accepted or industry standard approaches have value and get us close to where we want to be, rethinking problems from first principles can spur innovation and deliver better results
  * Industry standard approches will solve for a general problem, but if we think of a solution to our specific problem it can yield a better solution
  * CSS Variables
  * Hyperscript
  * No Taxonomy
  * Quality approach
  * React Hooks
  * Daily releases
* Always ask why / what is the problem we are addressing?
  * Just because we can, does that mean we should?
  * Are we solving an issue for the user, or completing a task?
  * Making sure we understand the problem as a whole, pushing back when it is not clearly understood
  * Finding value to bring to the users
  * ex. Widening of columns because the user asked for it
* Release Often
  * Release small iterable chunks of functionality with low risk 
  * Makes it easier to find and fix issues when they arise
  * Daily releases
  * Fast fixes to bugs found in the wild
  * promotion from dev to prod is fast
* Handling feedback
  * Iterate on the code until it is at a high level of craftsmanship before merging
  * Quality over speed
  * PR cycle, at least 1 approval is needed
* Finding the right abstractions
  * Is what you are writing generally useful?
  * Is it imperative code? 
  * Could it be factored out to something more generally
    * Write hooks, wrappers ("with" handlers), HoC's
  * Strive more towards being development minded
    * Fix the problems that inhibit productivity rather than working around them
    * Writing generally useful abstractions rather than 1 offs
  * This may be better stated in easy to understand or functional coding
* ...At the right time
  * Avoid premature optimization
  * Create the right abstractions at the right time
  * Avoid gold plating
    * More description for this term if we keep it
  * When it makes sense (repeating code / pattern, cleaning up code)
* If something is hard to understand or see something that can be done better, do it!
  * This keeps tech debt down, the code base simple, easy to understand and work with
  * This can be rolled in with development minded
* Keep the development environment simple and easy to use, providing clear error messages
* Write tests for the users
  * Have the tests focus on how a user will use the application rather than unit tests
* Use the least powerful abstraction to complete the job
  * Using switchcase instead of cond where applicable
  * Using map flatten + map rather reduce / breaking things out into smaller and easier to understand chunks
  * Safer to use the lesser abstraction, less chance of things going wrong
  * The intent of the code is clearer and more precise with simpler abstractions
* Usability and A11y
  * Use aria labels
  * Ensure our application is accessible so everyone can use it
  * Accessible applications tend to be more usable for all
* 
# (Stylistic) How we maintain our philosophy
* Can you easily explain your code?
* Could someone else explain your code?
* In a year from now will you still understand this code?
* Simple code alleviates the need for comments which can easily become stale

* Avoid using let (never use var) prefer using const instead 
  * Using let introduces additional state and potentially side effects into a function. This can make it diffcult to reason about the code and potentially introduce bugs
* There is no official taxonomy for the code base
# Deployment Cycle (Other Tips)