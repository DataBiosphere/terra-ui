## Table of Contents

- [Libraries and Technologies](#libraries-and-technologies)
  - [React](#react)
  - [react-hyperscript-helpers](#react-hyperscript-helpers)
  - [Lodash/fp](#lodashfp)
    - [Helpful Links](#helpful-links)
  - [CircleCI](#circleci)
- [Our Coding Philosophy](#our-coding-philosophy)
- [Coding Style](#coding-style)
- [Coding Practices](#coding-practices)

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

## CircleCI
* We have a daily release cycle (Release often)
  * We use CircleCI to run our tests and deploy our code
  * Once code has been merged in with our dev branch it will be deployed at approximately 10:00AM EST the following day
  
# Our Coding Philosophy
1. Write simple, easy to understand code
   * Simple does not mean easy, difficult problems can be coded with simplicity
   * This is difficult to do in practice, but we always strive for simple code

2. Ask why / what is the problem we are addressing?
     * Does it bring value to the user?
     * Just because we can do something, does that mean we should? Is it the right thing to do?
     * Are we solving an issue for the user, or completing a prescribed task?
     * Making sure we understand the problem as a whole, pushing back and getting clarification when it is not clearly understood
    
3. Don't be afraid to upset the status quo
     * Accepted or industry standard approaches have value and get us close to where we want to be, rethinking problems from first principles can spur innovation and deliver better results
     * The world around us is constantly changing and new solutions can present themselves when rethinking a problem
     * We accept this within our own codebase as well. If the rationale for doing something no longer holds, be willing to change it. "That is how we have always done it" is not a good rationale
     * **Is something hard to understand? Can it be done better? Do it!** This keeps tech debt down, the code base simple, easy to understand and work with.
     * Fix issues that can benefit everyone working on the codebase
  
4. Be willing to give and receive feedback
     * Being able to give and receive feedback is an excellent way to improve your skills as an individual and support the project

5. Usability and Accessibility
     * Ensure our application is accessible so everyone can use it
     * Accessible applications tend to be more usable for all
  * Test how the users will interact with the application
  
6. Mentoring is an integral part of becoming a better engineer
      * "If you can't explain it simply you don't understand it well enough" ~quote commonly misattributed to Einstein
      * Asking questions helps you and the person your asking learn

7. Keep the environment simple so the developer experience is painless
     * Use tools that keep the environment simple and straightforward to use
     * Provide clear error messages where appropriate

# Coding Style
1. We use react-hyperscript-helpers rather than JSX to keep our code base cleaner (status quo)
     * Hyperscript helpers allows developers to remain in a javascript context rather than having to make a mental context switch to the JSX templating language while developing

2. Use Lodash/fp for data transformation and functional utility
     * fp is the functional programming variant of Lodash designed for better composability, immutability and auto currying built in
     * This allows us to keep the data simple and not tie the data or shape of the data directly into our UI components
  
3. Use functional instead of class components
     * Functional components better support our functional coding style 
     * Use react hooks instead of lifecycle methods in a functional component
       * If you need more custom behavior look at the code base for our custom hooks
       * All custom hooks will be prefixed with "use" (e.g. useOnMount)
       
4.  We style our site using inline styling. This keeps the styling close to the code allowing developers to easily add styles without having to switch contexts to CSS or another file
  * This also prevents developers from having to deal with css classes and side effects of the cascade
      
5. Destructure down to the most atomic property in most cases

6. Use reasonable default values when appropriate rather than using imperative code or conditionals 
    * short-circuiting (double check this name)

7. Prefer using constants over (mutable) variables
    * Variables introduce additional state and potentially side effects into a function. This can make it difficult to reason about the code and potentially introduce bugs

8. We lint our code using our [custom ESLint rules](https://github.com/DataBiosphere/terra-ui/blob/dev/.eslintrc.js)
    * Using an eslint plugin with our IDE will improve your developer experience when working with our codebase

# Coding Practices

1. Keeping code simple is easier said than done. 
  * Some General thoughts on simplicity to take into account when contributing code
    * Could someone else explain your code?
    * In a year from now will you still understand this code?
    * Did you have to use comments to clarify your code, or is it self explanatory?
    * Do your functions and components need to know implementation details about other functions and components?
    * Is the data decoupled sufficiently from the logic?

  * Concepts that can make your code simpler
    * Reduce the amount of state in your functions and component - what is the minimum state needed?
    * Ensure functions and components are single purpose
    * Avoid side effects
    * When you need to deal with side effects, use the right abstractions to make it clear we are dealing with a side effect (e.g using useEffect)
    * Make use of small, simple helper functions
    * Keep functions pure
    * Utilize our existing constructs (e.g. use withErrorHandling instead of using try/catch)

  * Concepts that will add complexity to your code
    * Adding a lot of state
    * Sharing state across components
    * Excessive branching / conditionals
    * Adding special cases
    * Using abstractions that are too powerful for the intended result
    * Premature optimizations 

2. Favor functional, declarative coding
    * Functional code that is side-effect free or has predictable effects is easier to reason about and test
    * This helps us keeping data separate from the application logic
    * We prefer to composable constructs such as wrappers (e.g. withErrorHandling) as opposed to imperative code
    * When the need for imperative code arises, make sure the coding style is clearly imperative (use if/else rather than ternary expressions)
    * Take advantage of currying where you can
 
3. Understanding the problem
    * Before writing code, it is good to understand what value the change is bringing to the users
    * It is also good to understand the user flow - how the user uses the application to make sure we are providing the correct functionality rather than prescribed functionality
    * For example, a user may request making a data column wider so they can more easily copy and paste data
      * Diving into this deeper and asking why they want to copy data in the first place may yield more information unveiling what the user actually wants vs. what they asked for

4. Feedback
    * We prefer slowing down and iterating several times on a PR to ensure the code is right and in line with our standards rather than quickly pushing code through
    * To merge the code with our dev branch, at least 1 PR approval is needed
    * We emphasize a high level of code quality in our codebase to prevent technical debt and keep the application easy to develop
    * We encourage comments and discussion in PR's to release high quality, understandable code

5. Do not be afraid to change existing code to make it easier to work with
    * If you find yourself trying to work around existing code think about what improvements could be 
      made to it rather then continuing on the workaround
    * Feel free to reach out to any member of the team if you are unsure of how to proceed before investing too much time
      into a solution - we love to help our contributors!
      
6. Release often
    * **Once code is merged to dev, it is considered production ready and deployable**
    * We release daily. Once you have merged your code it will be live in production around 10:00AM
    * A rapid release cycle helps us to keep our deployment process simple and allows to to rapidly fix issues as they arise