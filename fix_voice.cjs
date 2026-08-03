const fs = require('fs');
let code = fs.readFileSync('src/services/voiceService.ts', 'utf8');

// The block was:
//         }
//       }
//     } catch (error: any) {
// One of those } belongs to `if (apiKey) {`.
// Let's replace:
//         }
//       }
//     } catch (error: any) {
// with
//         }
//     } catch (error: any) {

code = code.replace(
  /        \}\n      \}\n    \} catch \(error: any\) \{/,
  '        }\n    } catch (error: any) {'
);

fs.writeFileSync('src/services/voiceService.ts', code);
